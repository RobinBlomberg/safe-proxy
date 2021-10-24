export class RequestError<TCode extends string> extends Error {
  readonly code: TCode;
  readonly message: string;

  constructor(code: TCode, message: string = code) {
    super(message);

    this.code = code;
    this.message = message;
  }
}
