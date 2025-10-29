import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
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

    while (await this.prisma.page.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++counter}`;
    }

    return slug;
  }

  async create(createPageDto: CreatePageDto) {
    const { title, slug: providedSlug, content, published } = createPageDto;

    const slug = providedSlug || await this.generateUniqueSlug(title);

    if (await this.prisma.page.findUnique({ where: { slug } })) {
      throw new ConflictException('Slug already exists');
    }

    return this.prisma.page.create({
      data: {
        title,
        slug,
        content: content || { blocks: [] },
        published: published || false,
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [pages, total] = await Promise.all([
      this.prisma.page.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.page.count(),
    ]);

    return {
      data: pages,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.page.findUnique({
      where: { slug },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async findPublishedBySlug(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, published: true },
    });

    if (!page) {
      throw new NotFoundException('Published page not found');
    }

    return page;
  }

  async update(id: string, updatePageDto: UpdatePageDto) {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const { title, slug } = updatePageDto;

    if (slug && slug !== page.slug) {
      if (await this.prisma.page.findUnique({ where: { slug } })) {
        throw new ConflictException('Slug already exists');
      }
    }

    let finalSlug = slug;
    if (title && title !== page.title && !slug) {
      finalSlug = await this.generateUniqueSlug(title);
    }

    return this.prisma.page.update({
      where: { id },
      data: {
        ...updatePageDto,
        ...(finalSlug && { slug: finalSlug }),
      },
    });
  }

  async remove(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return this.prisma.page.delete({
      where: { id },
    });
  }

  async publish(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return this.prisma.page.update({
      where: { id },
      data: { published: true },
    });
  }

  async unpublish(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return this.prisma.page.update({
      where: { id },
      data: { published: false },
    });
  }
}