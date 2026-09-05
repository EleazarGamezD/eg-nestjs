
import {ApiProperty} from '@nestjs/swagger';
import {IsMongoId, IsNotEmpty, IsString} from 'class-validator';

export class CreateChatDto {
  @ApiProperty({description: 'User who initiates the chat', example: '64f2d0a1b2c34d5e67890123'})
  @IsString()
  @IsMongoId({message: 'senderUserId must be a valid MongoDB id.'})
  senderUserId: string;

  @ApiProperty({description: 'User who receives the chat', example: '64f2d0a1b2c34d5e67890456'})
  @IsNotEmpty()
  @IsString()
  @IsMongoId({message: 'recipientUserId must be a valid MongoDB id.'})
  recipientUserId: string;

  @ApiProperty({description: 'Transaction related to the chat', example: '64f2d0a1b2c34d5e67890456'})
  @IsNotEmpty()
  @IsString()
  @IsMongoId({message: 'transactionId must be a valid MongoDB id.'})
  transactionId: string;

  @ApiProperty({description: 'Order related to the chat', example: '64f2d0a1b2c34d5e67890456'})
  @IsNotEmpty()
  @IsString()
  orderId: string;
}


export class JoinedChatPayload {
  @ApiProperty({description: 'ID of the chat that has been joined', example: '64f2e1b3c4d5e67890123456'})
  chatId: string
}

export class ErrorJoinedChatPayload {
  @ApiProperty({description: 'Error code', example: 'CHAT_NOT_FOUND'})
  code: string;

  @ApiProperty({description: 'Error message', example: 'Chat not found'})
  message: string;
}
