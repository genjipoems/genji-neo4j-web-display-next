import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Undo2, Redo2, List, ListOrdered, Quote, Code2,
  Bold, Italic, Strikethrough, Underline as UnderlineIcon,
  Highlighter, Link2, Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
} from 'lucide-react';
import { updateScalarField } from './PoemEditApi.prod';
import styles from '../styles/pages/editableField.module.css';
import '../styles/pages/tiptapEditor.module.css';

function getSelectedValues(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(item => Array.isArray(item) && item[1])
    .map(item => item[0]);
}

const BLOCK_OPTIONS = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
];

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keeps the editor focused
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`tt-btn ${active ? 'tt-btn-active' : ''}`}
    >
      {children}
    </button>
  );
}

// Rich text editor used for every plain-text field below (replaces the old
// <input type="text"> and <textarea> branches). Kept in this file since
// it's only ever used from EditableField.
function TiptapEditor({ placeholder = 'Start typing…', content = '', onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Link.configure({ openOnClick: false }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  if (!editor) return null;

  const currentBlock = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : 'paragraph';

  const setBlock = (value) => {
    if (value === 'paragraph') editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: Number(value[1]) }).run();
  };

  const setLink = () => {
    const url = window.prompt('URL');
    if (url === null) return;
    if (url === '') editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="tt-wrapper">
      <div className="tt-toolbar">
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 size={16} />
        </ToolbarButton>

        <select className="tt-select" value={currentBlock} onChange={(e) => setBlock(e.target.value)}>
          {BLOCK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <span className="tt-divider" />

        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 size={16} />
        </ToolbarButton>

        <span className="tt-divider" />

        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={16} />
        </ToolbarButton>

        <span className="tt-divider" />

        <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter size={16} />
        </ToolbarButton>
        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Superscript" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          <SuperscriptIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="Subscript" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
          <SubscriptIcon size={16} />
        </ToolbarButton>

        <span className="tt-divider" />

        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify size={16} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className="tt-content" />
    </div>
  );
}

export default function EditableField({
  pnum,
  field,
  value,
  label,
  onSaved,
  placeholder = '',
  multiselOptions = [],
  datalistOptions = false,
  multisel = false,
  options = false,
  inputType = 'text',
  extraPayload = {},
  children
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [draft, setDraft] = useState(
    multisel ? getSelectedValues(value) : (value ?? '')
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // True whenever the field is going to render as free-form text (Tiptap),
  // i.e. none of the other special input modes apply and it's a text type.
  const isRichText = !datalistOptions && !options && !multisel && inputType === 'text';

  const handleOpen = () => {
    // Rebuild the draft from the current value every time
    // the editor opens.
    setDraft(
      multisel ? getSelectedValues(value) : (value ?? '')
    );

    setError(null);
    setIsOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
  console.log('DEBUG handleSave — field:', field, 'extraPayload:', extraPayload);

    try {
      await updateScalarField(pnum, field, draft, extraPayload);
      onSaved(field, draft);

      setIsOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(
      multisel ? getSelectedValues(value) : (value ?? '')
    );

    setError(null);
    setIsOpen(false);
  };

  return (
    <>
      <div
        style={{ cursor: 'pointer' }}
        onClick={handleOpen}
      >
        {children}
      </div>

      {isOpen && (
        <div
          className={styles.editPopupOverlay}
          onClick={handleCancel}
        >
          <div
            className={styles.editPopup}
            style={isRichText ? { width: 560, maxWidth: '90vw' } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className={styles.editPopupTitle}>
              Edit {label}
            </h4>

            {datalistOptions ? (
              <>
                <input
                  list={`${field}-datalist`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                />

                <datalist id={`${field}-datalist`}>
                  {datalistOptions.map(name => (
                    <option
                      key={name}
                      value={name}
                    />
                  ))}
                </datalist>
              </>
            ) : options ? (
              <select
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
              >
                <option value="">— none —</option>

                {options.map(opt => (
                  <option
                    key={opt}
                    value={opt}
                  >
                    {opt}
                  </option>
                ))}
              </select>
            ) : multisel ? (
              <div className={styles.optionList}>
                {multiselOptions.map(opt => (
                  <div
                    key={opt}
                    className={`${styles.optionItem} ${draft.includes(opt) ? styles.optionSelected : ''}`}
                    onClick={() => {
                      setDraft(prev =>
                        prev.includes(opt)
                          ? prev.filter(o => o !== opt)
                          : [...prev, opt]
                      );
                    }}
                  >
                    {opt.toUpperCase()}
                  </div>
                ))}
              </div>
            ) : isRichText ? (
              <TiptapEditor
                content={draft}
                placeholder={placeholder}
                onChange={(html) => setDraft(html)}
              />
            ) : (
              <input
                type={inputType}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
              />
            )}

            {error && (
              <p className={styles.editError}>
                {error}
              </p>
            )}

            <div className={styles.editPopupButtons}>
              <button
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}