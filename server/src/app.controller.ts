import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { ContactSubmissionDto } from './auth/dto/contact-submission.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Post('public/contact')
  @HttpCode(HttpStatus.OK)
  submitContact(@Body() dto: ContactSubmissionDto) {
    console.log(`[Contact Form Submission] Name: ${dto.name}, Email: ${dto.email}, Website: ${dto.websiteUrl || 'N/A'}, Message: ${dto.message}`);
    return { success: true, message: 'Message logged successfully' };
  }
}
