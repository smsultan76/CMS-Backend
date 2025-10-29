import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostStatus } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++counter}`;
    }

    return slug;
  }

  async create(createPostDto: CreatePostDto, authorId: string) {
    const { title, slug: providedSlug, content, status, categoryId, coverMediaId } = createPostDto;

    const slug = providedSlug || await this.generateUniqueSlug(title);

    if (await this.prisma.post.findUnique({ where: { slug } })) {
      throw new ConflictException('Slug already exists');
    }

    // Validate categoryId if provided
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Validate coverMediaId if provided
    if (coverMediaId) {
      const media = await this.prisma.media.findUnique({
        where: { id: coverMediaId },
      });
      if (!media) {
        throw new NotFoundException('Media not found');
      }
    }

    try {
      return await this.prisma.post.create({
        data: {
          title,
          slug,
          content,
          status: status || PostStatus.DRAFT,
          categoryId: categoryId || null,
          authorId,
          coverMediaId: coverMediaId || null,
        },
        include: {
          category: true,
          author: {
            select: { id: true, name: true, email: true }
          },
          coverMedia: true,
        },
      });
    } catch (error) {
      // Catch any other Prisma errors
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid foreign key reference');
      }
      throw error;
    }
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const { title, slug, categoryId, coverMediaId } = updatePostDto;

    // Validate categoryId if provided
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Validate coverMediaId if provided
    if (coverMediaId) {
      const media = await this.prisma.media.findUnique({
        where: { id: coverMediaId },
      });
      if (!media) {
        throw new NotFoundException('Media not found');
      }
    }

    if (slug && slug !== post.slug) {
      if (await this.prisma.post.findUnique({ where: { slug } })) {
        throw new ConflictException('Slug already exists');
      }
    }

    let finalSlug = slug;
    if (title && title !== post.title && !slug) {
      finalSlug = await this.generateUniqueSlug(title);
    }

    try {
      return await this.prisma.post.update({
        where: { id },
        data: {
          ...updatePostDto,
          ...(finalSlug && { slug: finalSlug }),
        },
        include: {
          category: true,
          author: {
            select: { id: true, name: true, email: true }
          },
          coverMedia: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid foreign key reference');
      }
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          author: {
            select: { id: true, name: true, email: true }
          },
        },
      }),
      this.prisma.post.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: posts,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, email: true }
        },
        coverMedia: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, deletedAt: null },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, email: true }
        },
        coverMedia: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  // async update(id: string, updatePostDto: UpdatePostDto) {
  //   const post = await this.prisma.post.findFirst({
  //     where: { id, deletedAt: null },
  //   });

  //   if (!post) {
  //     throw new NotFoundException('Post not found');
  //   }

  //   const { title, slug } = updatePostDto;

  //   if (slug && slug !== post.slug) {
  //     if (await this.prisma.post.findUnique({ where: { slug } })) {
  //       throw new ConflictException('Slug already exists');
  //     }
  //   }

  //   let finalSlug = slug;
  //   if (title && title !== post.title && !slug) {
  //     finalSlug = await this.generateUniqueSlug(title);
  //   }

  //   return this.prisma.post.update({
  //     where: { id },
  //     data: {
  //       ...updatePostDto,
  //       ...(finalSlug && { slug: finalSlug }),
  //     },
  //     include: {
  //       category: true,
  //       author: {
  //         select: { id: true, name: true, email: true }
  //       },
  //       coverMedia: true,
  //     },
  //   });
  // }

  async remove(id: string) {
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async publish(id: string) {
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, email: true }
        },
        coverMedia: true,
      },
    });
  }
}