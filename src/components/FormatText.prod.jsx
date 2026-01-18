import React from 'react';
import styles from '../styles/pages/blogTemplate.module.css';

const FormatText = ({ text, className }) => {
    const parseText = (text) => {
        const str = String(text || '');
        const list = [];
        let curIndex = 0;

        const lines = str.split('\n');

        return lines.map((line, lineIndex) => {
            const lineList = [];
            curIndex = 0;

            // Handle indentation with &nbsp;
            let indentMatch = line.match(/^(&nbsp;)+/);
            let indentCount = 0;
            if (indentMatch) {
                indentCount = indentMatch[0].match(/&nbsp;/g).length;
                line = line.slice(indentMatch[0].length);
            }

            // Check for heading (#) at the start of the line
            if (line.startsWith('#')) {
                const headingText = line.slice(1).trim();
                return {
                    type: 'heading',
                    content: headingText,
                    indent: indentCount,
                    isLastLine: lineIndex === lines.length - 1
                };
            }

            // First capture links with potential formatting inside them
            const linkPattern = /\[(.*?)\]\((.*?)\)/g;
            const otherPattern = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|_.*?_|\*.*?\*)/g;
            
            let replacedLine = line;
            const linkMatches = [];
            
            // First process all links and store them
            let linkMatch = linkPattern.exec(line);
            while (linkMatch !== null) {
                const fullMatch = linkMatch[0];
                const linkText = linkMatch[1];
                const url = linkMatch[2];
                
                // Store link information
                linkMatches.push({
                    fullMatch,
                    linkText,
                    url,
                    startIndex: linkMatch.index,
                    endIndex: linkMatch.index + fullMatch.length
                });
                
                linkMatch = linkPattern.exec(line);
            }
            
            // Sort links by their position in text
            linkMatches.sort((a, b) => a.startIndex - b.startIndex);
            
            // Process the line with links and other formatting
            if (linkMatches.length > 0) {
                let lastIndex = 0;
                
                for (const link of linkMatches) {
                    // Add plain text before the link
                    if (link.startIndex > lastIndex) {
                        lineList.push({ type: 'plain', text: line.slice(lastIndex, link.startIndex) });
                    }
                    
                    // Process the link text for formatting
                    const formattedLinkText = [];
                    let currentIndex = 0;
                    
                    // Check for formatting within link text
                    let formatMatch = otherPattern.exec(link.linkText);
                    while (formatMatch !== null) {
                        // Add plain text before formatted part
                        if (formatMatch.index > currentIndex) {
                            formattedLinkText.push({ 
                                type: 'plain', 
                                text: link.linkText.slice(currentIndex, formatMatch.index) 
                            });
                        }
                        
                        const formatText = formatMatch[0];
                        
                        if (formatText.indexOf('***') === 0 && formatText.lastIndexOf('***') === formatText.length - 3) {
                            formattedLinkText.push({ type: 'bolditalic', text: formatText.slice(3, -3) });
                        } else if (formatText.indexOf('**') === 0 && formatText.lastIndexOf('**') === formatText.length - 2) {
                            formattedLinkText.push({ type: 'bold', text: formatText.slice(2, -2) });
                        } else if ((formatText.indexOf('_') === 0 && formatText.lastIndexOf('_') === formatText.length - 1) ||
                                  (formatText.indexOf('*') === 0 && formatText.lastIndexOf('*') === formatText.length - 1)) {
                            formattedLinkText.push({ type: 'italic', text: formatText.slice(1, -1) });
                        } else {
                            formattedLinkText.push({ type: 'plain', text: formatText });
                        }
                        
                        currentIndex = formatMatch.index + formatMatch[0].length;
                        formatMatch = otherPattern.exec(link.linkText);
                    }
                    
                    // Add remaining plain text in link
                    if (currentIndex < link.linkText.length) {
                        formattedLinkText.push({ 
                            type: 'plain', 
                            text: link.linkText.slice(currentIndex) 
                        });
                    }
                    
                    // If no formatting found, keep simple link
                    if (formattedLinkText.length === 0) {
                        lineList.push({ 
                            type: 'link', 
                            text: link.linkText,
                            url: link.url
                        });
                    } else {
                        // Add link with formatting
                        lineList.push({ 
                            type: 'formattedLink', 
                            content: formattedLinkText.length > 0 ? formattedLinkText : [{ type: 'plain', text: link.linkText }],
                            url: link.url
                        });
                    }
                    
                    lastIndex = link.endIndex;
                }
                
                // Add remaining text after the last link
                if (lastIndex < line.length) {
                    // Process regular formatting in the remaining text
                    let remainingText = line.slice(lastIndex);
                    let match = otherPattern.exec(remainingText);
                    let remainingLastIndex = 0;
                    
                    while (match !== null) {
                        if (match.index > remainingLastIndex) {
                            lineList.push({ type: 'plain', text: remainingText.slice(remainingLastIndex, match.index) });
                        }
                        
                        const formatText = match[0];
                        
                        if (formatText.indexOf('***') === 0 && formatText.lastIndexOf('***') === formatText.length - 3) {
                            lineList.push({ type: 'bolditalic', text: formatText.slice(3, -3) });
                        } else if (formatText.indexOf('**') === 0 && formatText.lastIndexOf('**') === formatText.length - 2) {
                            lineList.push({ type: 'bold', text: formatText.slice(2, -2) });
                        } else if ((formatText.indexOf('_') === 0 && formatText.lastIndexOf('_') === formatText.length - 1) ||
                                  (formatText.indexOf('*') === 0 && formatText.lastIndexOf('*') === formatText.length - 1)) {
                            lineList.push({ type: 'italic', text: formatText.slice(1, -1) });
                        } else {
                            lineList.push({ type: 'plain', text: formatText });
                        }
                        
                        remainingLastIndex = match.index + match[0].length;
                        match = otherPattern.exec(remainingText);
                    }
                    
                    if (remainingLastIndex < remainingText.length) {
                        lineList.push({ type: 'plain', text: remainingText.slice(remainingLastIndex) });
                    }
                }
            } else {
                // If no links, process as before
                let match = otherPattern.exec(line);
                while (match !== null) {
                    if (match.index > curIndex) {
                        lineList.push({ type: 'plain', text: line.slice(curIndex, match.index) });
                    }
                    
                    const formatText = match[0];
                    
                    if (formatText.indexOf('***') === 0 && formatText.lastIndexOf('***') === formatText.length - 3) {
                        lineList.push({ type: 'bolditalic', text: formatText.slice(3, -3) });
                    } else if (formatText.indexOf('**') === 0 && formatText.lastIndexOf('**') === formatText.length - 2) {
                        lineList.push({ type: 'bold', text: formatText.slice(2, -2) });
                    } else if ((formatText.indexOf('_') === 0 && formatText.lastIndexOf('_') === formatText.length - 1) ||
                              (formatText.indexOf('*') === 0 && formatText.lastIndexOf('*') === formatText.length - 1)) {
                        lineList.push({ type: 'italic', text: formatText.slice(1, -1) });
                    } else {
                        lineList.push({ type: 'plain', text: formatText });
                    }
                    
                    curIndex = match.index + match[0].length;
                    match = otherPattern.exec(line);
                }
                
                if (curIndex < line.length) {
                    lineList.push({ type: 'plain', text: line.slice(curIndex) });
                }
            }

            return {
                type: 'line',
                content: lineList,
                indent: indentCount,
                isLastLine: lineIndex === lines.length - 1
            };
        });
    };

    if (!text) {
        return null;
    }

    const paragraphClassName = className ? `${className} mb-4` : "mb-4";

    return (
        <div className={paragraphClassName}>
            <p>
                {parseText(text).map((line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                        {line.indent > 0 && (
                            <span dangerouslySetInnerHTML={{ __html: '&nbsp;'.repeat(line.indent * 4) }} />
                        )}
                        {line.type === 'heading' ? (
                            <span className={styles.heading}>{line.content}</span>
                        ) : (
                            line.content.map((item, index) => {
                                switch (item.type) {
                                    case 'bold':
                                        return <strong key={index} className="font-bold">{item.text}</strong>;
                                    case 'italic':
                                        return <em key={index} className="italic">{item.text}</em>;
                                    case 'bolditalic':
                                        return <strong key={index} className="font-bold italic">{item.text}</strong>;
                                    case 'link':
                                        return (
                                            <a 
                                                key={index} 
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {item.text}
                                            </a>
                                        );
                                    case 'formattedLink':
                                        return (
                                            <a 
                                                key={index} 
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {item.content.map((formatItem, formatIndex) => {
                                                    switch (formatItem.type) {
                                                        case 'bold':
                                                            return <strong key={formatIndex} className="font-bold">{formatItem.text}</strong>;
                                                        case 'italic':
                                                            return <em key={formatIndex} className="italic">{formatItem.text}</em>;
                                                        case 'bolditalic':
                                                            return <strong key={formatIndex} className="font-bold italic">{formatItem.text}</strong>;
                                                        default:
                                                            return <span key={formatIndex}>{formatItem.text}</span>;
                                                    }
                                                })}
                                            </a>
                                        );
                                    default:
                                        return <span key={index}>{item.text}</span>;
                                }
                            })
                        )}
                        {!line.isLastLine && <br />}
                    </React.Fragment>
                ))}
            </p>
        </div>
    );
};

const FormatContent = ({ content, className }) => {
    if (!content) {
        return null;
    }

    try {
        const contentStr = String(content);
        
        // Check if content is HTML (contains HTML tags)
        // Simple check: if it contains < and > characters that form valid HTML tags
        const isHTML = /<[a-z][\s\S]*>/i.test(contentStr);
        
        if (isHTML) {
            // Render HTML content directly (from Tiptap editor)
            const containerClassName = className || '';
            return (
                <div 
                    className={containerClassName}
                    dangerouslySetInnerHTML={{ __html: contentStr }}
                />
            );
        } else {
            // Legacy: Handle plain text/Markdown format
            // Split by single \n and keep empty strings to preserve multiple line breaks
            const paragraphs = contentStr
                .split('\\n')
                .map(p => p.trim());

            const containerClassName = className ? `${className} space-y-4` : "space-y-4";

            // Group consecutive empty paragraphs to create multiple line breaks
            const result = [];
            let emptyCount = 0;

            for (let i = 0; i < paragraphs.length; i++) {
                if (paragraphs[i] === '') {
                    emptyCount++;
                } else {
                    // If we had empty lines before this paragraph, add appropriate breaks
                    if (emptyCount > 0) {
                        for (let j = 0; j < emptyCount; j++) {
                            result.push(<div key={`break-${i}-${j}`} style={{ height: '1em' }} />);
                        }
                        emptyCount = 0;
                    }
                    result.push(
                        <FormatText key={i} text={paragraphs[i]} className={className} />
                    );
                }
            }

            // Handle any remaining empty lines at the end
            if (emptyCount > 0) {
                for (let j = 0; j < emptyCount; j++) {
                    result.push(<div key={`break-end-${j}`} style={{ height: '1em' }} />);
                }
            }

            return (
                <div className={containerClassName}>
                    {result}
                </div>
            );
        }
    } catch (error) {
        console.error('Error formatting content:', error);
        return <div>Error formatting content</div>;
    }
};

export default FormatContent;