export class RequestError<TError> extends Error {
  readonly code: string;
  readonly error: TError;
  readonly name = RequestError.name;

  constructor(code: string, message: string, error: TError) {
    super(message);

    this.code = code;
    this.error = error;

    Object.setPrototypeOf(this, RequestError.prototype);
  }
}
