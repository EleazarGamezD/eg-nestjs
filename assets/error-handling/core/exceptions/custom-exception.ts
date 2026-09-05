import {BadRequestException, HttpStatus, NotFoundException} from '@nestjs/common';
import {ErrorMessageInput, resolveOriginalErrorMessage} from '../errors/error-message';

export interface CustomExceptionInterface {
  status: number;
  message: ErrorMessageInput;
}

export interface ErrorResponseData {
  message: string;
}

export class CustomException extends BadRequestException {
  constructor(message: ErrorMessageInput) {
    super({
      status: HttpStatus.BAD_REQUEST,
      message,
      originalMessage: resolveOriginalErrorMessage(message),
    });
  }
}

export class CustomNotFoundException extends NotFoundException {
  constructor(message: ErrorMessageInput) {
    super({
      status: HttpStatus.NOT_FOUND,
      message,
      originalMessage: resolveOriginalErrorMessage(message),
    });
  }
}
