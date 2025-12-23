'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import DragHandle from '@tiptap/extension-drag-handle'
import { useEffect, useState } from 'react';
import styles from '../styles/pages/tiptap.module.css';

const Tiptap = ({ content, onChange, editable = true, placeholder = 'Write something...' }) => {
  const [isTurnIntoOpen, setIsTurnIntoOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
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
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // 当选区变化或失焦时，收起下拉
  useEffect(() => {
    if (!editor) return;
    const hideDropdown = () => setIsTurnIntoOpen(false);
    editor.on('selectionUpdate', hideDropdown);
    editor.on('blur', hideDropdown);
    return () => {
      editor.off('selectionUpdate', hideDropdown);
      editor.off('blur', hideDropdown);
    };
  }, [editor]);

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

  return (
    <div className={styles.tiptapWrapper}>
      {editor && editable && (
        <BubbleMenu
          editor={editor}
          className={styles.notionBubbleMenu}
          tippyOptions={{
            duration: 100,
            placement: 'top',
            // 气泡隐藏时重置下拉
            onHidden: () => setIsTurnIntoOpen(false),
            onHide: () => setIsTurnIntoOpen(false),
          }}
        >
          <div className={styles.bubbleInner}>
            {/* 左侧：Turn into 下拉菜单（点击触发，移出不自动关闭） */}
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
            </div>
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

export default Tiptap