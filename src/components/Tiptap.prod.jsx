'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import DragHandle from '@tiptap/extension-drag-handle'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Text from '@tiptap/extension-text'
import Typography from '@tiptap/extension-typography'
import { useEffect, useState, useRef, useMemo, memo, useCallback } from 'react';
import styles from '../styles/pages/tiptap.module.css';

const Tiptap = ({ content, onChange, editable = true, placeholder = 'Write something...' }) => {
  const [isTurnIntoOpen, setIsTurnIntoOpen] = useState(false);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const colorPickerRef = useRef(null);
  const isInteractingWithColorPicker = useRef(false);

  // Update word count
  const updateWordCount = useCallback((editorInstance) => {
    if (!editorInstance) return;
    const text = editorInstance.getText();
    const characters = text.length;
    // Count words
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordsCount = text.trim() === '' ? 0 : words.length;
    
    setCharCount(characters);
    setWordCount(wordsCount);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Text,
      Typography,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      DragHandle.configure({
        // draggable nodes
        draggable: ({ node }) =>
          ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote', 'codeBlock', 'image'].includes(
            node.type.name,
          ),
      }),
    ],
    content: content || '',
    editable: editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
      // Update word and character count
      updateWordCount(editor);
    },
    editorProps: {
      attributes: {
        class: styles.tiptapEditor,
        'data-placeholder': placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      // avoid infinite loop
      if (currentContent !== content) {
        editor.commands.setContent(content || '');
      }
      // Update word count when content changes
      updateWordCount(editor);
    }
  }, [content, editor]);

  // Update word count on selection changes 
  useEffect(() => {
    if (!editor) return;
    const handleSelectionUpdate = () => {
      updateWordCount(editor);
    };
    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('update', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('update', handleSelectionUpdate);
    };
  }, [editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // close turn into dropdown when selection changes
  useEffect(() => {
    if (!editor) return;
    const hideTurnIntoDropdown = () => {
      setIsTurnIntoOpen(false);
    };
    // close turn into dropdown when selection changes
    editor.on('selectionUpdate', hideTurnIntoDropdown);
    // close turn into dropdown and color menu on blur
    editor.on('blur', () => {
      setIsTurnIntoOpen(false);
      setIsColorMenuOpen(false);
    });
    return () => {
      editor.off('selectionUpdate', hideTurnIntoDropdown);
      editor.off('blur');
    };
  }, [editor]);

  // close color menu when clicking outside
  useEffect(() => {
    if (!isColorMenuOpen) return;
    const handleClickOutside = (event) => {
      const target = event.target;
      // keep color menu open if clicking inside color menu or its wrapper
      if (target.closest(`.${styles.colorPicker}`) || target.closest(`.${styles.colorMenuWrapper}`)) {
        return;
      }

      if (target.closest(`.${styles.bubbleInner}`) || target.closest(`.${styles.notionBubbleMenu}`)) {
        return;
      }

      setIsColorMenuOpen(false);
    };
    // Use capture phase to catch events early
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isColorMenuOpen]);

  // close dropdown after clicking block type menu item
  const runBlockCommand = (fn) => {
    if (!editor) return;
    fn();
    setIsTurnIntoOpen(false);
  };

  const handleToggleLink = () => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const previousAttrs = editor.getAttributes('link') || {};
    const previousUrl = typeof previousAttrs.href === 'string' ? previousAttrs.href : undefined;
    const url = window.prompt('Enter URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return <div className={styles.loading}>Loading editor...</div>;
  }

  const currentBlockLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    if (editor.isActive('bulletList')) return 'Bulleted list';
    if (editor.isActive('orderedList')) return 'Numbered list';
    if (editor.isActive('codeBlock')) return 'Code';
    if (editor.isActive('blockquote')) return 'Quote';
    return 'Text';
  };

  // Color picker component
  const ColorPicker = memo(({ editor, onClose, colorPickerRef: ref, isInteractingRef }) => {
    // text colors
    const textColors = useMemo(() => [
      { name: 'Default', value: '#ffffff' }, // White is default for text
      { name: 'Gray', value: '#9b9a97' },
      { name: 'Brown', value: '#64473a' },
      { name: 'Orange', value: '#d9730d' },
      { name: 'Yellow', value: '#dfab01' },
      { name: 'Green', value: '#0f7b6c' },
      { name: 'Blue', value: '#0b6e99' },
      { name: 'Purple', value: '#6940a5' },
      { name: 'Pink', value: '#ad1a72' },
      { name: 'Red', value: '#e03e3e' },
    ], []);

    // background colors
    const backgroundColors = useMemo(() => [
      { name: 'Default', value: null }, // null is default for background
      { name: 'Black', value: '#000000' },
      { name: 'Dark Gray', value: '#37352f' },
      { name: 'Brown', value: '#64473a' },
      { name: 'Orange', value: '#d9730d' },
      { name: 'Yellow', value: '#dfab01' },
      { name: 'Green', value: '#0f7b6c' },
      { name: 'Blue', value: '#0b6e99' },
      { name: 'Purple', value: '#6940a5' },
      { name: 'Pink', value: '#ad1a72' },
      { name: 'Red', value: '#e03e3e' },
    ], []);

    // get current colors
    const getCurrentColors = () => {
      if (!editor) return { textColor: '#ffffff', highlightColor: null };
      const textColorAttr = editor.getAttributes('textStyle').color;
      return {
        textColor: textColorAttr || '#ffffff',
        highlightColor: editor.getAttributes('highlight').color,
        isDefaultTextColor: !textColorAttr || textColorAttr === '#ffffff',
        isDefaultBackgroundColor: !editor.getAttributes('highlight').color,
      };
    };

    const handleTextColorSelect = (colorValue) => {
      if (!editor) return;
      // keep color menu open
      const currentColor = editor.getAttributes('textStyle').color;
      // if already selected, unset it (back to default white)
      if (currentColor === colorValue) {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(colorValue).run();
      }
    };

    const handleBackgroundColorSelect = (colorValue) => {
      if (!editor) return;
      // keep color menu open
      const currentColor = editor.getAttributes('highlight').color;
      // if already selected, unset it (back to default no color)
      if (currentColor === colorValue) {
        editor.chain().focus().unsetHighlight().run();
      } else {
        if (colorValue === null) {
          editor.chain().focus().unsetHighlight().run();
        } else {
          editor.chain().focus().toggleHighlight({ color: colorValue }).run();
        }
      }
    };

    // update button active states
    const updateButtonStates = () => {
      if (!ref.current) return;
      const colors = getCurrentColors();
      const buttons = ref.current.querySelectorAll(`.${styles.colorSwatch}`);
      buttons.forEach((button, index) => {
        const isTextColorButton = index < textColors.length;
        if (isTextColorButton) {
          const color = textColors[index];
          const isActive = color.value === '#ffffff' 
            ? colors.isDefaultTextColor 
            : colors.textColor === color.value;
          if (isActive) {
            button.classList.add(styles.colorSwatchActive);
          } else {
            button.classList.remove(styles.colorSwatchActive);
          }
        } else {
          const bgIndex = index - textColors.length;
          const color = backgroundColors[bgIndex];
          const isActive = color.value === null 
            ? colors.isDefaultBackgroundColor 
            : colors.highlightColor === color.value;
          if (isActive) {
            button.classList.add(styles.colorSwatchActive);
          } else {
            button.classList.remove(styles.colorSwatchActive);
          }
        }
      });
    };

    // initialize button states
    useEffect(() => {
      if (editor && ref.current) {
        // use setTimeout to ensure DOM is ready
        setTimeout(() => {
          updateButtonStates();
        }, 0);
      }
    }, [editor]);

    // get current colors
    const colors = getCurrentColors();
    const currentTextColor = colors.textColor;
    const currentHighlightColor = colors.highlightColor;
    const isDefaultTextColor = colors.isDefaultTextColor;
    const isDefaultBackgroundColor = colors.isDefaultBackgroundColor;

    return (
      <div 
        ref={ref}
        className={styles.colorPicker} 
        onClick={(e) => {
          // keep color menu open
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseEnter={() => {
          isInteractingRef.current = true;
        }}
        onMouseLeave={() => {
          // set to false after a delay, in case user is moving between buttons
          setTimeout(() => {
            if (!ref.current?.matches(':hover')) {
              isInteractingRef.current = false;
            }
          }, 200);
        }}
        onMouseDown={(e) => {
          // keep color menu open
          e.stopPropagation();
          e.preventDefault();
          isInteractingRef.current = true;
        }}
        onMouseUp={(e) => {
          // keep color menu open
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <div className={styles.colorPickerHeader}>
          <span>Text color</span>
        </div>
        <div className={styles.colorGrid}>
          {textColors.map((color, index) => {
            const isActive = color.value === '#ffffff' 
              ? isDefaultTextColor 
              : currentTextColor === color.value;
            return (
              <button
                key={index}
                type="button"
                className={`${styles.colorSwatch} ${
                  isActive ? styles.colorSwatchActive : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  isInteractingRef.current = true;
                  handleTextColorSelect(color.value);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  isInteractingRef.current = true;
                }}
                onMouseEnter={() => {
                  isInteractingRef.current = true;
                }}
                title={color.name}
                style={{
                  border: 'none',
                }}
              >
                <span style={{ color: color.value }}>A</span>
              </button>
            );
          })}
        </div>

        <div className={styles.colorPickerHeader}>
          <span>Background color</span>
        </div>
        <div className={styles.colorGrid}>
          {backgroundColors.map((color, index) => {
            const isActive = color.value === null 
              ? isDefaultBackgroundColor 
              : currentHighlightColor === color.value;
            return (
              <button
                key={index}
                type="button"
                className={`${styles.colorSwatch} ${
                  isActive ? styles.colorSwatchActive : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  isInteractingRef.current = true;
                  handleBackgroundColorSelect(color.value);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  isInteractingRef.current = true;
                }}
                onMouseEnter={() => {
                  isInteractingRef.current = true;
                }}
                title={color.name}
                style={{
                  backgroundColor: color.value || 'transparent',
                  border: color.value === null ? '1px solid #6b6b6b' : 'none',
                }}
              >
                {color.value === null && <span className={styles.defaultIcon}>×</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  });


  return (
    <div className={styles.tiptapWrapper}>
      {editor && editable && (
        <BubbleMenu
          editor={editor}
          className={styles.notionBubbleMenu}
          tippyOptions={{
            duration: 100,
            placement: 'top',
            interactive: true,
            appendTo: () => document.body,
            // reset dropdown when bubble menu is hidden
            onHidden: () => {
              setIsTurnIntoOpen(false);
              // close color menu if user is not interacting with it
              if (!isInteractingWithColorPicker.current) {
                setIsColorMenuOpen(false);
              }
            },
            onHide: () => {
              setIsTurnIntoOpen(false);
              // close color menu if user is interacting with it
              if (!isInteractingWithColorPicker.current) {
                setIsColorMenuOpen(false);
              }
            },
          }}
        >
          <div className={styles.bubbleInner}>
            {/* left: Turn into dropdown */}
            <div className={styles.turnIntoWrapper}>
              <button
                type="button"
                className={styles.turnIntoTrigger}
                onClick={() => setIsTurnIntoOpen((open) => !open)}
              >
                <span className={styles.triggerLabel}>{currentBlockLabel()}</span>
                <span className={styles.triggerChevron}>▾</span>
              </button>

              {isTurnIntoOpen && (
                <div className={styles.turnIntoDropdown}>
                  <div className={styles.menuHeader}>Turn into</div>

                  <button
                    type="button"
                    className={`${styles.menuItem} ${editor.isActive('paragraph') ? styles.active : ''}`}
                    onClick={() =>
                      runBlockCommand(() => editor.chain().focus().setParagraph().run())
                    }
                  >
                    <span className={styles.menuIcon}>T</span>
                    <span className={styles.menuLabel}>Text</span>
                    {editor.isActive('paragraph') && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`${styles.menuItem} ${
                      editor.isActive('heading', { level: 1 }) ? styles.active : ''
                    }`}
                    onClick={() =>
                      runBlockCommand(() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run(),
                      )
                    }
                  >
                    <span className={styles.menuIcon}>H1</span>
                    <span className={styles.menuLabel}>Heading 1</span>
                    {editor.isActive('heading', { level: 1 }) && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`${styles.menuItem} ${
                      editor.isActive('heading', { level: 2 }) ? styles.active : ''
                    }`}
                    onClick={() =>
                      runBlockCommand(() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run(),
                      )
                    }
                  >
                    <span className={styles.menuIcon}>H2</span>
                    <span className={styles.menuLabel}>Heading 2</span>
                    {editor.isActive('heading', { level: 2 }) && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`${styles.menuItem} ${
                      editor.isActive('heading', { level: 3 }) ? styles.active : ''
                    }`}
                    onClick={() =>
                      runBlockCommand(() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run(),
                      )
                    }
                  >
                    <span className={styles.menuIcon}>H3</span>
                    <span className={styles.menuLabel}>Heading 3</span>
                    {editor.isActive('heading', { level: 3 }) && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`${styles.menuItem} ${
                      editor.isActive('bulletList') ? styles.active : ''
                    }`}
                    onClick={() =>
                      runBlockCommand(() =>
                        editor.chain().focus().toggleBulletList().run(),
                      )
                    }
                  >
                    <span className={styles.menuIcon}>•</span>
                    <span className={styles.menuLabel}>Bulleted list</span>
                    {editor.isActive('bulletList') && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`${styles.menuItem} ${
                      editor.isActive('orderedList') ? styles.active : ''
                    }`}
                    onClick={() =>
                      runBlockCommand(() =>
                        editor.chain().focus().toggleOrderedList().run(),
                      )
                    }
                  >
                    <span className={styles.menuIcon}>1.</span>
                    <span className={styles.menuLabel}>Numbered list</span>
                    {editor.isActive('orderedList') && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`${styles.menuItem} ${
                      editor.isActive('codeBlock') ? styles.active : ''
                    }`}
                    onClick={() =>
                      runBlockCommand(() =>
                        editor.chain().focus().toggleCodeBlock().run(),
                      )
                    }
                  >
                    <span className={styles.menuIcon}>{'</>'}</span>
                    <span className={styles.menuLabel}>Code</span>
                    {editor.isActive('codeBlock') && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`${styles.menuItem} ${
                      editor.isActive('blockquote') ? styles.active : ''
                    }`}
                    onClick={() =>
                      runBlockCommand(() =>
                        editor.chain().focus().toggleBlockquote().run(),
                      )
                    }
                  >
                    <span className={styles.menuIcon}>❝</span>
                    <span className={styles.menuLabel}>Quote</span>
                    {editor.isActive('blockquote') && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* right: inline style buttons */}
            <div className={styles.inlineToolbar}>
              <button
                type="button"
                className={`${styles.inlineButton} ${
                  editor.isActive('bold') ? styles.inlineActive : ''
                }`}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                B
              </button>
              <button
                type="button"
                className={`${styles.inlineButton} ${
                  editor.isActive('italic') ? styles.inlineActive : ''
                }`}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                I
              </button>
              <button
                type="button"
                className={`${styles.inlineButton} ${
                  editor.isActive('underline') ? styles.inlineActive : ''
                }`}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                U
              </button>
              <button
                type="button"
                className={`${styles.inlineButton} ${
                  editor.isActive('strike') ? styles.inlineActive : ''
                }`}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                S
              </button>
              <button
                type="button"
                className={`${styles.inlineButton} ${
                  editor.isActive('link') ? styles.inlineActive : ''
                }`}
                onClick={handleToggleLink}
              >
                🔗
              </button>

              {/* Color Button */}
              <div className={styles.colorMenuWrapper}>
                <button
                  type="button"
                  className={`${styles.inlineButton} ${
                    (editor.getAttributes('textStyle').color || editor.isActive('highlight')) ? styles.inlineActive : ''
                  }`}
                  onClick={() => {
                    setIsColorMenuOpen((open) => !open);
                  }}
                  title="Text & Background color"
                >
                  <span style={{ 
                    color: editor.getAttributes('textStyle').color || '#ffffff',
                    backgroundColor: editor.getAttributes('highlight').color || 'transparent',
                    padding: '2px 4px',
                    borderRadius: '2px',
                    minWidth: '16px',
                    display: 'inline-block'
                  }}>A</span>
                </button>
                {isColorMenuOpen && (
                  <ColorPicker
                    editor={editor}
                    onClose={() => setIsColorMenuOpen(false)}
                    colorPickerRef={colorPickerRef}
                    isInteractingRef={isInteractingWithColorPicker}
                  />
                )}
              </div>
            </div>
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
      
      {/* Word count display */}
      {editable && editor && (
        <div className={styles.wordCount}>
          <span className={styles.wordCountItem}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          <span className={styles.wordCountSeparator}>·</span>
          <span className={styles.wordCountItem}>
            {charCount} {charCount === 1 ? 'character' : 'characters'}
          </span>
        </div>
      )}
    </div>
  );
}

export default Tiptap