import {INestApplication} from '@nestjs/common';
import {AsyncApiDocumentBuilder, AsyncApiModule} from 'nestjs-asyncapi';

export async function setupAsyncApi(app: INestApplication) {
  const asyncApiOptions = new AsyncApiDocumentBuilder()
    .setTitle('Mercado Meet WebSocket API')
    .setDescription('AsyncAPI for Mercado Meet Socket.IO channels (chat, typing, read-receipts, and real-time notifications)')
    .setVersion('1.1.0')
    .setDefaultContentType('application/json')
    .addSecurity('BearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .setContact(
      'Mercado Meet Support Team',
      'https://mercadomeet.com.co/help-center',
      'contacto@mercadomeet.com',
    )
    // Note: AsyncAPI recognizes ws/wss protocols. Socket.IO runs over WebSocket.
    .addServer('ws-local', {
      url: 'ws://localhost:3000',
      protocol: 'ws',
      description: 'Servidor local (Socket.IO sobre WebSocket)',
    })
    .addServer('ws-dev', {
      url: 'wss://dev.v2.api.mercadomeet.com',
      protocol: 'wss',
      description: 'Servidor de desarrollo (Socket.IO sobre WebSocket)',
    })
    .addServer('ws-prod', {
      url: 'wss://v2.api.mercadomeet.com',
      protocol: 'wss',
      description: 'Production server (Socket.IO over WebSocket)',
    })
    .build();

  const asyncApiDoc = await AsyncApiModule.createDocument(app, asyncApiOptions);
  await AsyncApiModule.setup('sockets-docs', app, asyncApiDoc);

}

