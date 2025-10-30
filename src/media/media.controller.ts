import { Controller, Get, Post, Param, Delete, UseInterceptors, UploadedFile, BadRequestException, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MediaService } from './media.service';
import { MediaResponseDto } from './dto/media-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Upload a media file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'File upload',
    schema: { type: 'object',
      properties: { file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPG, JPEG, PNG, GIF, WebP) max 5MB',
        },
      },
    },
  })
  @UseInterceptors( FileInterceptor('file', { storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024, },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const media = await this.mediaService.create({
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
    });

    return {
      id: media.id,
      filename: media.filename,
      url: media.url,
      mimeType: media.mimeType,
      createdAt: media.createdAt,
    };
  }




  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all media files' })
  async findAll(): Promise<MediaResponseDto[]> {
    const media = await this.mediaService.findAll();
    return media.map(item => ({
      id: item.id,
      filename: item.filename,
      url: item.url,
      mimeType: item.mimeType,
      createdAt: item.createdAt,
    }));
  }




  
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get media file by ID' })
  async findOne(@Param('id') id: string): Promise<MediaResponseDto> {
    const media = await this.mediaService.findOne(id);
    return {
      id: media.id,
      filename: media.filename,
      url: media.url,
      mimeType: media.mimeType,
      createdAt: media.createdAt,
    };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Delete a media file' })
  async remove(@Param('id') id: string) {
    const media = await this.mediaService.remove(id);
    return {
      message: 'Media deleted successfully',
      id: media.id,
    };
  }
}