export class RequestError<TError> extends Error {
  readonly error: TError;
  readonly name = RequestError.name;

  constructor(message: string, error: TError) {
    super(message);

    this.error = error;

    Object.setPrototypeOf(this, RequestError.prototype);
  }
}
