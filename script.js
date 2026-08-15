// ============================================================
// CODEHUB - EDITOR DE CÓDIGO
// script.js
// ============================================================


// ============================================================
// ELEMENTOS
// ============================================================

const $ = (selector) => document.querySelector(selector);

const codeEditor = $("#codeEditor");
const lineNumbers = $("#lineNumbers");

const fileList = $("#fileList");
const tabsContainer = $("#tabs");

const previewFrame = $("#previewFrame");
const consoleOutput = $("#consoleOutput");

const projectNameInput = $("#projectName");
const projectTreeName = $("#projectTreeName");

const fileTypeStatus = $("#fileTypeStatus");
const cursorPosition = $("#cursorPosition");
const saveStatus = $("#saveStatus");

const runBtn = $("#runBtn");
const saveProjectBtn = $("#saveProjectBtn");

const addFileBtn = $("#addFileBtn");
const newFileSidebarBtn = $("#newFileSidebarBtn");

const refreshPreviewBtn = $("#refreshPreviewBtn");
const openPreviewBtn = $("#openPreviewBtn");

const clearConsoleBtn = $("#clearConsoleBtn");

const fileModal = $("#fileModal");
const newFileName = $("#newFileName");
const closeModalBtn = $("#closeModalBtn");
const cancelFileBtn = $("#cancelFileBtn");
const createFileBtn = $("#createFileBtn");

const renameModal = $("#renameModal");
const renameFileInput = $("#renameFileInput");
const closeRenameModalBtn = $("#closeRenameModalBtn");
const cancelRenameBtn = $("#cancelRenameBtn");
const confirmRenameBtn = $("#confirmRenameBtn");

const contextMenu = $("#contextMenu");
const renameFileBtn = $("#renameFileBtn");
const deleteFileBtn = $("#deleteFileBtn");


// ============================================================
// CONFIGURAÇÕES
// ============================================================

const STORAGE_KEY = "codehub_project_v2";

let saveTimer = null;
let contextFile = null;
let renameTarget = null;


// ============================================================
// PROJETO PADRÃO
// ============================================================

function createDefaultProject() {

    return {
        name: "Meu Projeto",

        files: {
            "index.html": `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Meu Projeto</title>
</head>

<body>

    <main class="container">

        <h1>Olá, CodeHub! 🚀</h1>

        <p>O preview está funcionando.</p>

        <button id="testButton">
            Clique aqui
        </button>

    </main>

</body>
</html>`,

            "style.css": `* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;

    display: flex;
    align-items: center;
    justify-content: center;

    font-family: Arial, sans-serif;

    background: #f6f8fa;
}

.container {
    padding: 40px;
    text-align: center;
}

h1 {
    color: #238636;
}

p {
    color: #57606a;
}

button {
    padding: 12px 20px;

    border: none;
    border-radius: 6px;

    background: #238636;
    color: white;

    font-size: 16px;
    cursor: pointer;
}

button:hover {
    opacity: 0.85;
}`,

            "script.js": `const button = document.getElementById("testButton");

if (button) {
    button.addEventListener("click", () => {
        alert("JavaScript funcionando! 🚀");
    });
}

console.log("Projeto executado com sucesso.");`
        },

        openFiles: [
            "index.html",
            "style.css",
            "script.js"
        ],

        activeFile: "index.html"
    };

}


let project = createDefaultProject();


// ============================================================
// SEGURANÇA
// ============================================================

function hasOwn(object, key) {

    return Object.prototype.hasOwnProperty.call(
        object,
        key
    );

}


function getFileExtension(fileName) {

    const parts = fileName.split(".");

    if (parts.length < 2) {
        return "";
    }

    return parts.pop().toLowerCase();

}


// ============================================================
// CARREGAR PROJETO
// ============================================================

function loadProject() {

    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
        return;
    }

    try {

        const savedProject = JSON.parse(savedData);

        if (
            savedProject &&
            typeof savedProject === "object" &&
            savedProject.files &&
            typeof savedProject.files === "object"
        ) {

            project = savedProject;

        }

    } catch (error) {

        console.error("Erro ao carregar projeto:", error);

        project = createDefaultProject();

    }

}


// ============================================================
// NORMALIZAR PROJETO
// ============================================================

function normalizeProject() {

    if (
        !project.files ||
        typeof project.files !== "object" ||
        Object.keys(project.files).length === 0
    ) {

        project.files = createDefaultProject().files;

    }


    if (
        !Array.isArray(project.openFiles)
    ) {

        project.openFiles = [];

    }


    project.openFiles = project.openFiles.filter(
        (fileName) => hasOwn(project.files, fileName)
    );


    if (
        !project.activeFile ||
        !hasOwn(project.files, project.activeFile)
    ) {

        project.activeFile =
            Object.keys(project.files)[0];

    }


    if (
        !project.openFiles.includes(project.activeFile)
    ) {

        project.openFiles.push(
            project.activeFile
        );

    }


    if (!project.name) {
        project.name = "Meu Projeto";
    }

}


// ============================================================
// SALVAR PROJETO
// ============================================================

function saveProject(showConsole = false) {

    saveCurrentEditorContent();

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(project)
        );

        saveStatus.textContent = "Salvo";

        if (showConsole) {

            addConsole(
                "Projeto salvo com sucesso.",
                "success"
            );

        }

    } catch (error) {

        saveStatus.textContent = "Erro ao salvar";

        addConsole(
            "Erro ao salvar o projeto.",
            "error"
        );

        console.error(error);

    }

}


// ============================================================
// SALVAMENTO AUTOMÁTICO
// ============================================================

function scheduleAutoSave() {

    clearTimeout(saveTimer);

    saveStatus.textContent = "Alterações não salvas";

    saveTimer = setTimeout(() => {

        saveProject(false);

    }, 500);

}


// ============================================================
// ÍCONE
// ============================================================

function getFileIcon(fileName) {

    const extension = getFileExtension(fileName);

    const icons = {
        html: "🌐",
        htm: "🌐",
        css: "🎨",
        js: "⚡",
        mjs: "⚡",
        py: "🐍",
        json: "📦",
        md: "📝",
        txt: "📄",
        xml: "📋",
        svg: "🖼️",
        png: "🖼️",
        jpg: "🖼️",
        jpeg: "🖼️",
        gif: "🖼️"
    };

    return icons[extension] || "📄";

}


// ============================================================
// TIPO DO ARQUIVO
// ============================================================

function getFileType(fileName) {

    const extension = getFileExtension(fileName);

    const types = {
        html: "HTML",
        htm: "HTML",
        css: "CSS",
        js: "JAVASCRIPT",
        mjs: "JAVASCRIPT",
        py: "PYTHON",
        json: "JSON",
        md: "MARKDOWN",
        txt: "TEXT",
        xml: "XML",
        svg: "SVG"
    };

    return types[extension] || "TEXT";

}


// ============================================================
// SALVAR CONTEÚDO ATUAL
// ============================================================

function saveCurrentEditorContent() {

    if (
        !project.activeFile ||
        !hasOwn(project.files, project.activeFile)
    ) {
        return;
    }

    project.files[project.activeFile] =
        codeEditor.value;

}


// ============================================================
// EXPLORADOR DE ARQUIVOS
// ============================================================

function renderFileList() {

    fileList.innerHTML = "";

    const files = Object.keys(project.files).sort(
        (a, b) => {

            if (a === "index.html") return -1;
            if (b === "index.html") return 1;

            return a.localeCompare(b);

        }
    );


    files.forEach((fileName) => {

        const item = document.createElement("div");

        item.className = "file-item";

        if (fileName === project.activeFile) {
            item.classList.add("active");
        }


        const icon = document.createElement("span");

        icon.className = "file-icon";
        icon.textContent = getFileIcon(fileName);


        const name = document.createElement("span");

        name.className = "file-name";
        name.textContent = fileName;


        item.append(icon, name);


        item.addEventListener("click", () => {

            openFile(fileName);

        });


        item.addEventListener("contextmenu", (event) => {

            event.preventDefault();

            contextFile = fileName;

            showContextMenu(
                event.clientX,
                event.clientY
            );

        });


        fileList.appendChild(item);

    });

}


// ============================================================
// ABAS
// ============================================================

function renderTabs() {

    tabsContainer.innerHTML = "";


    project.openFiles.forEach((fileName) => {

        if (!hasOwn(project.files, fileName)) {
            return;
        }


        const tab = document.createElement("div");

        tab.className = "tab";

        if (fileName === project.activeFile) {
            tab.classList.add("active");
        }


        const icon = document.createElement("span");

        icon.textContent = getFileIcon(fileName);


        const name = document.createElement("span");

        name.textContent = fileName;


        const close = document.createElement("span");

        close.className = "tab-close";
        close.textContent = "×";


        tab.append(icon, name, close);


        tab.addEventListener("click", () => {

            openFile(fileName);

        });


        close.addEventListener("click", (event) => {

            event.stopPropagation();

            closeTab(fileName);

        });


        tabsContainer.appendChild(tab);

    });

}


// ============================================================
// ABRIR ARQUIVO
// ============================================================

function openFile(fileName) {

    if (!hasOwn(project.files, fileName)) {
        return;
    }


    saveCurrentEditorContent();


    if (!project.openFiles.includes(fileName)) {

        project.openFiles.push(fileName);

    }


    project.activeFile = fileName;


    codeEditor.value = project.files[fileName];


    fileTypeStatus.textContent =
        getFileType(fileName);


    renderFileList();
    renderTabs();

    updateLineNumbers();
    updateCursorPosition();

    scheduleAutoSave();

}


// ============================================================
// FECHAR ABA
// ============================================================

function closeTab(fileName) {

    if (project.openFiles.length <= 1) {
        return;
    }


    const index =
        project.openFiles.indexOf(fileName);


    project.openFiles =
        project.openFiles.filter(
            (file) => file !== fileName
        );


    if (project.activeFile === fileName) {

        let newIndex = index - 1;

        if (newIndex < 0) {
            newIndex = 0;
        }


        const nextFile =
            project.openFiles[newIndex];


        project.activeFile = nextFile;

        codeEditor.value =
            project.files[nextFile];


        fileTypeStatus.textContent =
            getFileType(nextFile);

    }


    renderTabs();
    renderFileList();

    updateLineNumbers();
    updateCursorPosition();

    saveProject(false);

}


// ============================================================
// LINHAS
// ============================================================

function updateLineNumbers() {

    const lines =
        codeEditor.value.split("\n").length;


    const numbers = [];


    for (let line = 1; line <= lines; line++) {

        numbers.push(line);

    }


    lineNumbers.textContent =
        numbers.join("\n");

}


// ============================================================
// CURSOR
// ============================================================

function updateCursorPosition() {

    const position =
        codeEditor.selectionStart;


    const textBeforeCursor =
        codeEditor.value.slice(0, position);


    const lines =
        textBeforeCursor.split("\n");


    const line =
        lines.length;


    const column =
        lines[lines.length - 1].length + 1;


    cursorPosition.textContent =
        `Ln ${line}, Col ${column}`;

}


// ============================================================
// EDITOR EVENTS
// ============================================================

codeEditor.addEventListener("input", () => {

    saveCurrentEditorContent();

    updateLineNumbers();
    updateCursorPosition();

    scheduleAutoSave();

});


codeEditor.addEventListener("scroll", () => {

    lineNumbers.scrollTop =
        codeEditor.scrollTop;

});


codeEditor.addEventListener("keyup", () => {

    updateCursorPosition();

});


codeEditor.addEventListener("click", () => {

    updateCursorPosition();

});


codeEditor.addEventListener("select", () => {

    updateCursorPosition();

});


codeEditor.addEventListener("keydown", (event) => {

    // TAB
    if (event.key === "Tab") {

        event.preventDefault();

        const start =
            codeEditor.selectionStart;

        const end =
            codeEditor.selectionEnd;

        const value =
            codeEditor.value;


        codeEditor.value =
            value.substring(0, start) +
            "    " +
            value.substring(end);


        codeEditor.selectionStart =
            start + 4;

        codeEditor.selectionEnd =
            start + 4;


        saveCurrentEditorContent();

        updateLineNumbers();
        updateCursorPosition();

        scheduleAutoSave();

    }


    // CTRL / CMD + S
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s"
    ) {

        event.preventDefault();

        saveProject(true);

    }

});


// ============================================================
// NOVO ARQUIVO
// ============================================================

function openFileModal() {

    newFileName.value = "";

    fileModal.classList.remove("hidden");

    setTimeout(() => {

        newFileName.focus();

    }, 50);

}


function closeFileModal() {

    fileModal.classList.add("hidden");

}


function getDefaultFileContent(fileName) {

    const extension =
        getFileExtension(fileName);


    const templates = {

        html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Novo Arquivo</title>
</head>
<body>

    <h1>Olá!</h1>

</body>
</html>`,

        css: `/* ${fileName} */

* {
    box-sizing: border-box;
}

body {
    margin: 0;
}`,

        js: `// ${fileName}

console.log("Arquivo carregado.");`,

        py: `# ${fileName}

print("Olá, Python!")`,

        json: `{
    "name": "novo-projeto"
}`,

        md: `# Novo documento

Escreva aqui.`,

        txt: ""

    };


    return templates[extension] || "";

}


function createNewFile() {

    const fileName =
        newFileName.value.trim();


    if (!fileName) {

        alert("Digite o nome do arquivo.");

        newFileName.focus();

        return;

    }


    if (hasOwn(project.files, fileName)) {

        alert("Já existe um arquivo com este nome.");

        return;

    }


    project.files[fileName] =
        getDefaultFileContent(fileName);


    project.openFiles.push(fileName);


    closeFileModal();


    openFile(fileName);


    saveProject(false);


    addConsole(
        `Arquivo criado: ${fileName}`,
        "success"
    );

}


// ============================================================
// EVENTOS NOVO ARQUIVO
// ============================================================

addFileBtn.addEventListener(
    "click",
    openFileModal
);


newFileSidebarBtn.addEventListener(
    "click",
    openFileModal
);


closeModalBtn.addEventListener(
    "click",
    closeFileModal
);


cancelFileBtn.addEventListener(
    "click",
    closeFileModal
);


createFileBtn.addEventListener(
    "click",
    createNewFile
);


newFileName.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            createNewFile();
        }

    }
);


document.querySelectorAll(".file-template")
    .forEach((button) => {

        button.addEventListener("click", () => {

            newFileName.value =
                button.dataset.file;

            newFileName.focus();

        });

    });


// ============================================================
// MENU CONTEXTO
// ============================================================

function showContextMenu(x, y) {

    contextMenu.classList.remove("hidden");


    const menuWidth =
        contextMenu.offsetWidth;

    const menuHeight =
        contextMenu.offsetHeight;


    let left = x;
    let top = y;


    if (left + menuWidth > window.innerWidth) {

        left =
            window.innerWidth - menuWidth - 10;

    }


    if (top + menuHeight > window.innerHeight) {

        top =
            window.innerHeight - menuHeight - 10;

    }


    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;

}


function hideContextMenu() {

    contextMenu.classList.add("hidden");

}


// ============================================================
// RENOMEAR
// ============================================================

function openRenameModal(fileName) {

    if (!fileName || !hasOwn(project.files, fileName)) {
        return;
    }


    renameTarget = fileName;

    renameFileInput.value = fileName;

    renameModal.classList.remove("hidden");


    setTimeout(() => {

        renameFileInput.focus();

        renameFileInput.select();

    }, 50);

}


function closeRenameModal() {

    renameModal.classList.add("hidden");

    renameTarget = null;

}


function renameFile() {

    const newName =
        renameFileInput.value.trim();


    if (!renameTarget) {
        return;
    }


    if (!newName) {

        alert("Digite um nome.");

        return;

    }


    if (
        newName !== renameTarget &&
        hasOwn(project.files, newName)
    ) {

        alert("Já existe um arquivo com este nome.");

        return;

    }


    const oldName = renameTarget;
    const content = project.files[oldName];


    delete project.files[oldName];


    project.files[newName] = content;


    project.openFiles =
        project.openFiles.map((fileName) => {

            if (fileName === oldName) {
                return newName;
            }

            return fileName;

        });


    if (project.activeFile === oldName) {

        project.activeFile = newName;

    }


    closeRenameModal();


    codeEditor.value =
        project.files[project.activeFile];


    fileTypeStatus.textContent =
        getFileType(project.activeFile);


    renderFileList();
    renderTabs();

    saveProject(false);


    addConsole(
        `Arquivo renomeado: ${oldName} → ${newName}`,
        "success"
    );

}


// ============================================================
// EXCLUIR
// ============================================================

function deleteFile(fileName) {

    if (!fileName || !hasOwn(project.files, fileName)) {
        return;
    }


    const filesCount =
        Object.keys(project.files).length;


    if (filesCount <= 1) {

        alert(
            "O projeto precisa ter pelo menos um arquivo."
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Deseja excluir o arquivo "${fileName}"?`
        );


    if (!confirmed) {
        return;
    }


    delete project.files[fileName];


    project.openFiles =
        project.openFiles.filter(
            (file) => file !== fileName
        );


    if (project.activeFile === fileName) {

        project.activeFile =
            project.openFiles[0] ||
            Object.keys(project.files)[0];


        codeEditor.value =
            project.files[project.activeFile];


        fileTypeStatus.textContent =
            getFileType(project.activeFile);

    }


    normalizeProject();

    renderFileList();
    renderTabs();

    updateLineNumbers();
    updateCursorPosition();

    saveProject(false);


    addConsole(
        `Arquivo excluído: ${fileName}`,
        "warn"
    );

}


// ============================================================
// EVENTOS CONTEXTO
// ============================================================

renameFileBtn.addEventListener(
    "click",
    () => {

        hideContextMenu();

        openRenameModal(contextFile);

    }
);


deleteFileBtn.addEventListener(
    "click",
    () => {

        hideContextMenu();

        deleteFile(contextFile);

    }
);


document.addEventListener(
    "click",
    (event) => {

        if (!contextMenu.contains(event.target)) {

            hideContextMenu();

        }

    }
);


// ============================================================
// EVENTOS RENOMEAR
// ============================================================

closeRenameModalBtn.addEventListener(
    "click",
    closeRenameModal
);


cancelRenameBtn.addEventListener(
    "click",
    closeRenameModal
);


confirmRenameBtn.addEventListener(
    "click",
    renameFile
);


renameFileInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            renameFile();
        }

    }
);


// ============================================================
// PREVIEW
// ============================================================

function getAllFilesByExtension(extension) {

    return Object.keys(project.files)
        .filter((fileName) => {

            return getFileExtension(fileName) === extension;

        })
        .sort((a, b) => {

            // style.css primeiro
            if (a === "style.css") return -1;
            if (b === "style.css") return 1;

            // script.js primeiro
            if (a === "script.js") return -1;
            if (b === "script.js") return 1;

            return a.localeCompare(b);

        });

}


// Remove referências locais a CSS
function removeLocalCssLinks(html) {

    return html.replace(
        /<link\b[^>]*href=["'][^"']+\.css["'][^>]*>/gi,
        ""
    );

}


// Remove referências locais a JS
function removeLocalScripts(html) {

    return html.replace(
        /<script\b[^>]*src=["'][^"']+\.js["'][^>]*><\/script>/gi,
        ""
    );

}


// Impede que </style> feche nossa tag
function escapeStyleContent(css) {

    return css.replace(
        /<\/style>/gi,
        "<\\/style>"
    );

}


// Impede que </script> feche nossa tag
function escapeScriptContent(js) {

    return js.replace(
        /<\/script>/gi,
        "<\\/script>"
    );

}


// CONSTRUIR PREVIEW
function buildPreview() {

    saveCurrentEditorContent();


    const html =
        project.files["index.html"] || "";


    if (!html.trim()) {

        return {
            success: false,
            message:
                "Não foi encontrado conteúdo em index.html."
        };

    }


    const cssFiles =
        getAllFilesByExtension("css");


    const jsFiles =
        getAllFilesByExtension("js");


    const cssCode =
        cssFiles
            .map((fileName) => {

                return `/* ===== ${fileName} ===== */\n` +
                    project.files[fileName];

            })
            .join("\n\n");


    const jsCode =
        jsFiles
            .map((fileName) => {

                return `// ===== ${fileName} =====\n` +
                    project.files[fileName];

            })
            .join("\n\n");


    let finalHtml = html;


    // Remove referências aos arquivos locais
    // porque vamos inserir o conteúdo diretamente
    finalHtml = removeLocalCssLinks(finalHtml);

    finalHtml = removeLocalScripts(finalHtml);


    // Adiciona um listener para enviar erros ao editor
    const previewBridge = `
<script>
(function () {
    function send(type, message) {
        parent.postMessage({
            source: "codehub-preview",
            type: type,
            message: String(message)
        }, "*");
    }

    window.onerror = function (message, source, line, column) {
        send(
            "error",
            message + " (linha " + line + ", coluna " + column + ")"
        );
    };

    window.addEventListener("unhandledrejection", function (event) {
        send("error", event.reason || "Promise rejeitada.");
    });

    console.log = function () {
        send(
            "log",
            Array.from(arguments).join(" ")
        );
    };
})();
<\/script>`;


    const cssTag = `
<style>
${escapeStyleContent(cssCode)}
</style>`;


    const jsTag = `
<script>
${escapeScriptContent(jsCode)}
<\/script>`;


    // Insere CSS antes de </head>
    if (/<\/head>/i.test(finalHtml)) {

        finalHtml =
            finalHtml.replace(
                /<\/head>/i,
                cssTag + "\n" + previewBridge + "\n</head>"
            );

    } else {

        finalHtml =
            cssTag +
            previewBridge +
            finalHtml;

    }


    // Insere JS antes de </body>
    if (/<\/body>/i.test(finalHtml)) {

        finalHtml =
            finalHtml.replace(
                /<\/body>/i,
                jsTag + "\n</body>"
            );

    } else {

        finalHtml += jsTag;

    }


    return {
        success: true,
        content: finalHtml,
        cssFiles,
        jsFiles
    };

}


// EXECUTAR PREVIEW
function runPreview() {

    saveCurrentEditorContent();

    saveProject(false);


    const result = buildPreview();


    if (!result.success) {

        addConsole(
            result.message,
            "error"
        );

        return;

    }


    // Limpa o iframe antes de executar novamente
    previewFrame.srcdoc = "";


    // Pequeno timeout para forçar recarregamento
    setTimeout(() => {

        previewFrame.srcdoc =
            result.content;


        addConsole(
            `Preview executado. CSS: ${result.cssFiles.length} | JS: ${result.jsFiles.length}`,
            "success"
        );

    }, 20);

}


// ============================================================
// BOTÕES PREVIEW
// ============================================================

runBtn.addEventListener(
    "click",
    runPreview
);


refreshPreviewBtn.addEventListener(
    "click",
    runPreview
);


openPreviewBtn.addEventListener(
    "click",
    () => {

        const result = buildPreview();


        if (!result.success) {

            addConsole(
                result.message,
                "error"
            );

            return;

        }


        const previewWindow =
            window.open(
                "",
                "_blank"
            );


        if (!previewWindow) {

            addConsole(
                "O navegador bloqueou a abertura da nova janela.",
                "error"
            );

            return;

        }


        previewWindow.document.open();

        previewWindow.document.write(
            result.content
        );

        previewWindow.document.close();

    }
);


// ============================================================
// MENSAGENS DO PREVIEW
// ============================================================

window.addEventListener(
    "message",
    (event) => {

        if (
            !event.data ||
            event.data.source !== "codehub-preview"
        ) {
            return;
        }


        if (event.data.type === "error") {

            addConsole(
                `Preview: ${event.data.message}`,
                "error"
            );

        }


        if (event.data.type === "log") {

            addConsole(
                event.data.message,
                "info"
            );

        }

    }
);


// ============================================================
// CONSOLE
// ============================================================

function escapeHtml(text) {

    const element =
        document.createElement("div");

    element.textContent = String(text);

    return element.innerHTML;

}


function addConsole(message, type = "info") {

    const item =
        document.createElement("div");


    item.className =
        `console-message ${type}`;


    const prefix = document.createElement("span");

    prefix.textContent = "› ";


    const content =
        document.createTextNode(String(message));


    item.append(prefix, content);


    consoleOutput.appendChild(item);


    consoleOutput.scrollTop =
        consoleOutput.scrollHeight;

}


clearConsoleBtn.addEventListener(
    "click",
    () => {

        consoleOutput.innerHTML = "";

        addConsole(
            "Console limpo.",
            "info"
        );

    }
);


// ============================================================
// NOME DO PROJETO
// ============================================================

projectNameInput.addEventListener(
    "input",
    () => {

        project.name =
            projectNameInput.value.trim() ||
            "Meu Projeto";


        projectTreeName.textContent =
            project.name.toUpperCase();


        scheduleAutoSave();

    }
);


// ============================================================
// BOTÃO SALVAR
// ============================================================

saveProjectBtn.addEventListener(
    "click",
    () => {

        saveProject(true);

    }
);


// ============================================================
// ATALHOS GLOBAIS
// ============================================================

document.addEventListener(
    "keydown",
    (event) => {

        // CTRL / CMD + ENTER = RUN
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "Enter"
        ) {

            event.preventDefault();

            runPreview();

        }


        // ESC
        if (event.key === "Escape") {

            closeFileModal();

            closeRenameModal();

            hideContextMenu();

        }

    }
);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

function initialize() {

    loadProject();

    normalizeProject();


    projectNameInput.value =
        project.name;


    projectTreeName.textContent =
        project.name.toUpperCase();


    codeEditor.value =
        project.files[project.activeFile] || "";


    fileTypeStatus.textContent =
        getFileType(project.activeFile);


    renderFileList();

    renderTabs();

    updateLineNumbers();

    updateCursorPosition();


    addConsole(
        "CodeHub iniciado.",
        "success"
    );


    // Executa o preview inicial
    setTimeout(() => {

        runPreview();

    }, 100);

}


// ============================================================
// START
// ============================================================

initialize();
