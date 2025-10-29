import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesFilterDto } from './dto/categories-filter.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/-+/g, '-') // Replace multiple - with single -
      .trim();
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingCategory = await this.prisma.category.findUnique({
        where: { slug },
      });

      if (!existingCategory) {
        break;
      }

      slug = `${baseSlug}-${++counter}`;
    }

    return slug;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, slug: providedSlug } = createCategoryDto;

    // Check if category with same name already exists
    const existingCategory = await this.prisma.category.findFirst({
      where: { 
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null 
      },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    // Generate unique slug if not provided
    const slug = providedSlug || await this.generateUniqueSlug(name);

    // Check if slug already exists
    const existingSlug = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    return this.prisma.category.create({
      data: {
        name,
        slug,
      },
    });
  }

  async findAll(filterDto: CategoriesFilterDto) {
    const { search, page = 1, limit = 10 } = filterDto; // Provide fallbacks
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null, // Only non-deleted categories
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { 
        id, 
        deletedAt: null 
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { 
        slug, 
        deletedAt: null 
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Check if category exists
    const existingCategory = await this.prisma.category.findFirst({
      where: { 
        id, 
        deletedAt: null 
      },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    const { name, slug } = updateCategoryDto;

    // Check if name already exists (excluding current category)
    if (name && name !== existingCategory.name) {
      const nameExists = await this.prisma.category.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          id: { not: id },
          deletedAt: null 
        },
      });

      if (nameExists) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Check if slug already exists (excluding current category)
    if (slug && slug !== existingCategory.slug) {
      const slugExists = await this.prisma.category.findUnique({
        where: { slug },
      });

      if (slugExists) {
        throw new ConflictException('Slug already exists');
      }
    }

    // Generate slug if name changed but slug not provided
    let finalSlug = slug;
    if (name && name !== existingCategory.name && !slug) {
      finalSlug = await this.generateUniqueSlug(name);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(finalSlug && { slug: finalSlug }),
      },
    });
  }

  async remove(id: string) {
    // Check if category exists
    const category = await this.prisma.category.findFirst({
      where: { 
        id, 
        deletedAt: null 
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has posts
    const postsCount = await this.prisma.post.count({
      where: { 
        categoryId: id,
        deletedAt: null 
      },
    });

    if (postsCount > 0) {
      throw new BadRequestException('Cannot delete category with associated posts');
    }

    // Soft delete
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.deletedAt) {
      throw new BadRequestException('Category is not deleted');
    }

    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}