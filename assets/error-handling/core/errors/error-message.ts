export type ErrorLanguage = 'en' | 'es';

export interface LocalizedErrorMessage {
  en: string;
  es?: string;
  code?: string;
}

export type ErrorMessageInput = string | LocalizedErrorMessage | string[] | LocalizedErrorMessage[];

export function createErrorMessage(message: LocalizedErrorMessage): LocalizedErrorMessage {
  return message;
}

export function isLocalizedErrorMessage(value: unknown): value is LocalizedErrorMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as LocalizedErrorMessage).en === 'string' &&
    ((value as LocalizedErrorMessage).es === undefined ||
      typeof (value as LocalizedErrorMessage).es === 'string')
  );
}

export function resolveErrorMessage(
  message: unknown,
  language: ErrorLanguage = 'en',
): string | string[] {
  if (Array.isArray(message)) {
    return message.map((item) => resolveErrorMessage(item, language)).flat();
  }

  if (isLocalizedErrorMessage(message)) {
    return message[language] ?? message.en;
  }

  return typeof message === 'string' ? message :
    language === 'es' ? 'Error interno del servidor' : 'Internal server error';
}

export function resolveOriginalErrorMessage(message: unknown): string | string[] {
  if (Array.isArray(message)) {
    return message.map((item) => resolveOriginalErrorMessage(item)).flat();
  }

  if (isLocalizedErrorMessage(message)) {
    return message.en;
  }

  return typeof message === 'string' ? message : 'Internal server error';
}
