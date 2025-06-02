export const readStreamableValue = jest.fn().mockImplementation(async function* () {
  yield "Test AI stream data from virtual mock";
});

export const createStreamableValue = jest.fn(() => ({
  value: "mocked streamable value from virtual mock",
  update: jest.fn(),
  done: jest.fn(),
}));
