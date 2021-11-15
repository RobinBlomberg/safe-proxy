export class RequestError<TCode extends string> {
  readonly code: TCode;
  readonly message: string;
  readonly name = 'RequestError';
  readonly stack: string | undefined;

  constructor(code: TCode, message: string = code) {
    this.code = code;
    this.message = message ?? code;
    this.stack = Error().stack;
  }
}
