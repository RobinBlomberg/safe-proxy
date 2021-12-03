export class RequestError<TCode extends string> extends Error {
  readonly code: TCode;
  readonly name = RequestError.name;

  constructor(code: TCode, message: string = code) {
    super(message ?? code);

    this.code = code;

    Object.setPrototypeOf(this, RequestError.prototype);
  }
}
