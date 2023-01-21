const fs = require("fs"),
  path = require("path");

const bookmarkFiles = fs.readdirSync(__dirname).filter(function (item) {
  return (
    item.indexOf("bookmarks") == 0 &&
    path.extname(item).toLowerCase() === ".html"
  );
});

if (bookmarkFiles.length === 0) return;

const bookmarkFile = bookmarkFiles[0];

const bookmarkPreFix = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>`;

let bookmarkFileContent = fs
  .readFileSync(bookmarkFile, "utf-8")
  .replaceAll("\r", "");

if (
  bookmarkPreFix.indexOf(
    bookmarkFileContent.substring(0, bookmarkPreFix.length)
  ) !== 0
)
  return;

bookmarkFileContent = bookmarkFileContent.split("\n");

bookmarkFileContent = bookmarkFileContent
  .filter((item) => item.indexOf("<DT><A") != -1)
  .map((item) => item.trim().substring(4));

const ATTR = (TAG, NAME) => {
    let VALUE = null;

    const preChar = NAME.concat('="');

    const prePos = TAG.indexOf(preChar);
    
    if(prePos != -1) {
        const sufPos = TAG.indexOf('"', prePos+preChar.length);
        VALUE = TAG.substring(prePos+preChar.length, sufPos);
    }

    return [NAME, VALUE];
}

const TEXT = (TAG) => {
    const endPos = TAG.lastIndexOf('</A>');
    const startPos = TAG.lastIndexOf('">', endPos) + '">'.length;

    return ['TEXT', TAG.substring(startPos, endPos)];
}

let set = new Set();

bookmarkFileContent = bookmarkFileContent.reduce(function(initArr, item) {
    const $HREF = ATTR(item, 'HREF');

    if(set.has($HREF[1])) {
        return initArr;
    }

    set.add($HREF[1]);

    const $TEXT = TEXT(item);
    const $ADD_DATE = ATTR(item, 'ADD_DATE');
    const $ICON = ATTR(item, 'ICON');

    initArr.push(Object.fromEntries([$TEXT, $HREF, $ADD_DATE, $ICON]));

    return initArr;
}, []);

set.clear();

const TAB = "    ";
const TAB_LV = (LV, R="") => {
    while (LV--) R += TAB; return R;
};

const ADD_DATE = String(Date.now()).substring(0, 10);
const LAST_MODIFIED = ADD_DATE;
const PERSONAL_TOOLBAR_FOLDER = '북마크바';

const result = [];
result.push(bookmarkPreFix)
result.push(`<DL><p>`);
result.push(`${TAB_LV(1)}<DT><H3 ADD_DATE="${ADD_DATE}" LAST_MODIFIED="${LAST_MODIFIED}" PERSONAL_TOOLBAR_FOLDER="true">${PERSONAL_TOOLBAR_FOLDER}</H3>`);
result.push(`${TAB_LV(1)}<DL><p>`);

bookmarkFileContent.forEach(item => {
    const TAG = `${TAB_LV(2)}<DT><A HREF="${item.HREF}" ADD_DATE="${item.ADD_DATE}"${item.ICON == null ? '' : ' ICON="'+item.ICON+'"'}>${item.TEXT}</A></DT>`;
    result.push(TAG);
})

result.push(`${TAB_LV(1)}</DL><p>`)
result.push(`</DL><p>`)

const outputFilePath = path.join(__dirname, bookmarkFile.substring(0, bookmarkFile.length-'.html'.length).concat(`-${Date.now()}.out.html`));

fs.writeFileSync(outputFilePath, result.join('\n'), 'utf-8');