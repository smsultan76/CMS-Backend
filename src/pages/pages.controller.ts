import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('pages')
@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Create a new page' })
  create(@Body() createPageDto: CreatePageDto) {
    return this.pagesService.create(createPageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pages' })
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.pagesService.findAll(page, limit);
  }

  @Get('published')
  @ApiOperation({ summary: 'Get published pages only' })
  findPublished(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.pagesService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get page by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get page by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.pagesService.findBySlug(slug);
  }

  @Get('published/:slug')
  @ApiOperation({ summary: 'Get published page by slug' })
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.pagesService.findPublishedBySlug(slug);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Update a page' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updatePageDto: UpdatePageDto) {
    return this.pagesService.update(id, updatePageDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Delete a page' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.remove(id);
  }

  @Patch(':id/publish')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Publish a page' })
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.publish(id);
  }

  @Patch(':id/unpublish')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Unpublish a page' })
  unpublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.unpublish(id);
  }
}