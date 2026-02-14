
# --------------------------------------------------------------------
# This file is part of Conseal <https://conse.al/>.
# Copyright (C) 2026 goggybox <https://github.com/goggybox>
# Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

# Please keep this header comment in all copies of the program.
# --------------------------------------------------------------------

import os

PROJECT_NAME = "Conseal"
AUTHOR_LINK = "goggybox https://github.com/goggybox"
LICENSE_TEXT = """
--------------------------------------------------------------------
This file is part of Conseal <https://conse.al/>.
Copyright (C) 2026 goggybox <https://github.com/goggybox>
Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

Please keep this header comment in all copies of the program.
--------------------------------------------------------------------
"""

COMMENT_STYLES = {
    ".py": "# ",
    ".js": "// ",
    ".css": "/* ",
    ".html": "<!-- ",
    ".htm": "<!-- ",
}

# the exact line that marks the end of the GPL license (DO NOT MODIFY)
END_MARKER = "--------------------------------------------------------------------"

def generate_header(comment_style: str) -> str:
    """Generate the complete license header with comment markers."""
    if comment_style.startswith("/*") or comment_style.startswith("<!--"):
        # block comments: opener + text + closer
        header = f"{comment_style}\n{LICENSE_TEXT}\n"
        header += "*/\n\n" if comment_style.startswith("/*") else "-->\n\n"
    else:
        # line comments: prefix each non-empty line
        header = "\n".join(
            comment_style + line if line.strip() else line 
            for line in LICENSE_TEXT.splitlines()
        ) + "\n\n"
    
    return header


def remove_old_license(content: str, comment_style: str) -> str:
    """
    Removes the old GPL license header from content if present at the 
    beginning of the file. Returns the content without the license header.
    """
    if not content.strip():
        return content
    
    if comment_style.startswith("/*") or comment_style.startswith("<!--"):
        # verify file starts with a block comment
        if not content.startswith(comment_style):
            return content
        
        # search for end marker near the start (within first 4KB)
        search_area = content[:4096]
        end_marker_pos = search_area.find(END_MARKER)
        if end_marker_pos == -1:
            return content
        
        # find the closing delimiter after the end marker
        closer = "*/" if comment_style.startswith("/*") else "-->"
        closer_pos = content.find(closer, end_marker_pos)
        if closer_pos == -1:
            return content
        
        # remove everything through the closing delimiter
        new_content = content[closer_pos + len(closer):]
        return new_content.lstrip('\n')
    
    else:
        lines = content.splitlines()
        if not lines:
            return content
        
        # verify first non-empty line is a comment
        first_idx = 0
        while first_idx < len(lines) and not lines[first_idx].strip():
            first_idx += 1
        
        if first_idx >= len(lines) or not lines[first_idx].startswith(comment_style):
            return content
        
        # find the end marker within first 100 lines
        end_idx = -1
        search_limit = min(100, len(lines))
        for i in range(search_limit):
            if END_MARKER in lines[i]:
                end_idx = i
                break
        
        if end_idx == -1:
            return content
        
        # skip empty lines after the license for clean removal
        next_idx = end_idx + 1
        while next_idx < len(lines) and not lines[next_idx].strip():
            next_idx += 1
        
        return "\n".join(lines[next_idx:])


def add_header_to_file(file_path: str, comment_style: str):
    """remove old license (if present) and add new license header to a file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        return
    
    # check if new license is already present (exact match)
    header_text = generate_header(comment_style)
    if header_text.strip() in content:
        return
    
    # remove old license and add new one
    content_without_license = remove_old_license(content, comment_style)
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(header_text + content_without_license)
    except Exception as e:
        return


def walk_and_update_headers(root_dir: str = "."):
    """walk through directory tree and update license headers in all supported files."""
    excluded_dirs = {".git", "__pycache__", "node_modules", "venv", "env", ".venv"}
    
    for dirpath, _, filenames in os.walk(root_dir):
        # skip common excluded directories
        if any(excluded in dirpath for excluded in excluded_dirs):
            continue
            
        for filename in filenames:
            ext = os.path.splitext(filename)[1]
            if ext in COMMENT_STYLES:
                file_path = os.path.join(dirpath, filename)
                add_header_to_file(file_path, COMMENT_STYLES[ext])

if __name__ == "__main__":
    walk_and_update_headers()