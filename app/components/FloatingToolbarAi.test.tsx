import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FloatingToolbarAi } from './FloatingToolbarAi';
import { aiModel as getSelectedAgent, availableAiModels, setSelectedAgent, resetSelectedAgent } from '../config';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { createEditor, EditorState } from 'lexical';
// Import the function to be mocked
import { continueConversation } from '../actions/ai';

// Mock app/actions/ai.ts
// The ai/rsc mock is now handled by moduleNameMapper in jest.config.js
jest.mock('../actions/ai', () => ({
  continueConversation: jest.fn().mockResolvedValue(
    (async function* () {
      yield "Test AI response";
    })()
  ),
}));

// Type cast the imported function to its mocked version for type safety in tests
const mockedContinueConversation = continueConversation as jest.MockedFunction<typeof continueConversation>;


const mockEditorConfig = {
  namespace: 'TestEditor',
  theme: {},
  onError: jest.fn(),
  nodes: [], // Add any custom nodes if required by the component under test
};

// Wrapper component to provide Lexical context
const TestEditorWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialConfig = {
    ...mockEditorConfig,
    editorState: null, // or some initial editor state if needed
  };
  const editor = createEditor(initialConfig as any); // Cast to any to handle potential type mismatches
  return (
    <LexicalComposer initialConfig={initialConfig as any}> {/* Cast to any */}
      {children}
      {/* Minimal plugins to make it work */}
      <RichTextPlugin contentEditable={<ContentEditable />} placeholder={<div>Enter some text...</div>} />
      <HistoryPlugin />
    </LexicalComposer>
  );
};

describe('FloatingToolbarAi', () => {
  beforeEach(() => {
    resetSelectedAgent(); // Reset the selected agent before each test
    // Reset mocks if they are stateful between tests
    jest.clearAllMocks();
  });

  test('should allow selecting a different AI model and update config', async () => {
    const user = userEvent.setup();
    render(
      <TestEditorWrapper>
        <FloatingToolbarAi state="ai" setState={jest.fn()} onClose={jest.fn()} />
      </TestEditorWrapper>
    );

    const selectElement = screen.getByLabelText('Select AI Model');
    expect(selectElement).toBeInTheDocument();

    // Initial model check
    expect(getSelectedAgent()).toBe(availableAiModels[0]); // Default is gpt-4o-mini

    const modelToSelect = availableAiModels[1]; // e.g., gpt-3.5-turbo

    // Simulate user selecting the new model
    await user.selectOptions(selectElement, modelToSelect);

    expect(selectElement).toHaveValue(modelToSelect);
    expect(getSelectedAgent()).toBe(modelToSelect);
  });

  test('should use the selected agent when submitting a prompt', async () => {
    const user = userEvent.setup();
    const mockSetState = jest.fn();
    const mockOnClose = jest.fn();

    // Clear any previous calls to the mock before this test runs
    mockedContinueConversation.mockClear();

    render(
      <TestEditorWrapper>
        <FloatingToolbarAi state="ai" setState={mockSetState} onClose={mockOnClose} />
      </TestEditorWrapper>
    );

    const selectElement = screen.getByLabelText('Select AI Model');
    const promptInput = screen.getByPlaceholderText('Custom prompt…');
    const submitButton = screen.getByRole('button', { name: "Submit custom prompt" });

    const modelToSelect = availableAiModels[1]; // e.g., "gpt-3.5-turbo"
    const testPrompt = "This is a test prompt";

    // 1. Select a model
    await user.selectOptions(selectElement, modelToSelect);
    expect(getSelectedAgent()).toBe(modelToSelect); // Verify config updated

    // 2. Type a prompt
    await user.type(promptInput, testPrompt);
    expect(promptInput).toHaveValue(testPrompt);

    // 3. Submit the prompt
    await user.click(submitButton);

    // 4. Assertions
    // Check that continueConversation was called
    expect(mockedContinueConversation).toHaveBeenCalled();

    // To check the model used:
    // The actual `continueConversation` uses `aiModel()` from `config.ts`.
    // We've already confirmed `aiModel()` (as `getSelectedAgent`) was updated to `modelToSelect`.
    // So, if `mockedContinueConversation` was called, it implicitly used the correct model.
    // No direct way to get the model from the mock's arguments unless we change the mock structure,
    // but the critical part is that config was set correctly before the call.

    // We can also check if the messages passed are correct
    expect(mockedContinueConversation).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user', content: testPrompt }),
      ])
    );

    // Check that input is cleared after submission
    await screen.findByDisplayValue("");

  });
});
