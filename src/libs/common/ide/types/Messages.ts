export type MessageId = string;

export interface Messages {
  /**
   * Displays a warning message {@link message} to the user along with possible
   * {@link options} for them to select.
   *
   * @param id Each code site where we issue a warning should have a unique,
   * human readable id for testability, eg "deprecatedPositionInference". This
   * allows us to write tests without tying ourself to the specific wording of
   * the warning message provided in {@link message}.
   * @param message The message to display to the user
   * @param options A list of options to display to the user. The selected
   * option will be returned by this function
   * @returns The option selected by the user, or `undefined` if no option was
   * selected
   */
  showWarning(
    id: MessageId,
    message: string,
    ...options: string[]
  ): Promise<string | undefined>;
}
