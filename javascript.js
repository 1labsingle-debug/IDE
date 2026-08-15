// ============================================================
// CODEHUB - WEB CODE EDITOR
// ============================================================


// ELEMENTOS
const codeEditor = document.getElementById("codeEditor");
const lineNumbers = document.getElementById("lineNumbers");

const fileList = document.getElementById("fileList");
const tabsContainer = document.getElementById("tabs");

const previewFrame = document.getElementById("previewFrame");
const consoleOutput = document.getElementById("consoleOutput");

const projectNameInput = document.getElementById("projectName");
const projectTreeName = document.getElementById("projectTreeName");

const fileTypeStatus = document.getElementById("fileTypeStatus");
const cursorPosition = document.getElementById("cursorPosition");
const saveStatus = document.getElementById("saveStatus");


// BOTÕES
const runBtn = document.getElementById("runBtn");
const saveProjectBtn = document.getElementById("saveProjectBtn");

const addFileBtn = document.getElementById("addFileBtn");
const newFileSidebarBtn = document.getElementById("newFileSidebarBtn");

const refreshPreviewBtn = document.getElementById("refreshPreviewBtn");
const openPreviewBtn = document.getElementById("openPreviewBtn");

const clearConsoleBtn = document.getElementById("clearConsoleBtn");


// MODAL NOVO ARQUIVO
const fileModal = document.getElementById("fileModal");

const newFileName = document.getElementById("newFileName");

const closeModalBtn = document.getElementById("closeModalBtn");
const cancelFileBtn = document.getElementById("cancelFileBtn");
const createFileBtn = document.getElementById("createFileBtn");


// MODAL RENOMEAR
const renameModal = document.getElementById("renameModal");

const renameFileInput = document.getElementById("renameFileInput");

const closeRenameModalBtn = document.getElementById("closeRenameModalBtn");
const cancelRenameBtn = document.getElementById("cancelRenameBtn");
const confirmRenameBtn = document.getElementById("confirmRenameBtn");


// CONTEXT MENU
const contextMenu = document.getElementById("contextMenu");

const renameFileBtn = document.getElementById("renameFileBtn");
const deleteFileBtn = document.getElementById("deleteFileBtn");


// ============================================================
// ESTADO DO PROJETO
// ============================================================

const STORAGE_KEY = "codehub_project_v1";

let project = {
    name: "Meu Projeto",

    files: {
        "index.html": `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Meu Projeto</title>

    <link rel="stylesheet" href="style.css">
</head>

<body>

    <main class="container">

        <h1>Olá, CodeHub! 🚀</h1>

        <p>
            Seu editor HTML está funcionando.
        </p>

        <button id="testButton">
            Clique aqui
        </button>

    </main>

    <script src="script.js"><\/script>

</body>
</html>`,

        "style.css": `* {
    box-sizing: border-box;
}

body {
    margin: 0;

    min-height: 100vh;

    display: grid;
    place-items: center;

    font-family: Arial, sans-serif;

    background: #f6f8fa;
}

.container {
    text-align: center;

    padding: 40px;
}

h1 {
    color: #238636;
}

button {
    padding: 12px 20px;

    border: none;
    border-radius: 6px;

    background: #238636;
    color: white;

    cursor: pointer;
}`,

        "script.js": `const button = document.getElementById("testButton");

button.addEventListener("click", () => {
    alert("Olá! O JavaScript está funcionando! 🚀");
});`
    },

    openFiles: [
        "index.html",
        "style.css",
        "script.js"
    ],

    activeFile: "index.html"
};


let contextFile = null;
let renameTarget = null;
let saveTimeout = null;


// ============================================================
// CARREGAR PROJETO
// ============================================================

function loadProject() {

    const savedProject = localStorage.getItem(STORAGE_KEY);

    if (!savedProject) {
        return;
    }

    try {

        const parsedProject = JSON.parse(savedProject);

        if (
            parsedProject &&
            parsedProject.files &&
            Object.keys(parsedProject.files).length > 0
        ) {
            project = parsedProject;
        }

    } catch (error) {

        console.error("Erro ao carregar projeto:", error);

    }

}


// ============================================================
// SALVAR PROJETO
// ============================================================

function saveProject(showMessage = true) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(project)
    );

    saveStatus.textContent = "Salvo";

    if (showMessage) {

        addConsole(
            "Projeto salvo no navegador.",
            "success"
        );

    }

}


// SALVAMENTO AUTOMÁTICO
function autoSave() {

    clearTimeout(saveTimeout);

    saveStatus.textContent = "Alterações não salvas";

    saveTimeout = setTimeout(() => {

        saveProject(false);

    }, 600);

}


// ============================================================
// ÍCONES DOS ARQUIVOS
// ============================================================

function getFileIcon(fileName) {

    const extension =
        fileName
            .split(".")
            .pop()
            .toLowerCase();

    const icons = {

        html: "🌐",
        htm: "🌐",

        css: "🎨",

        js: "⚡",
        mjs: "⚡",

        json: "📦",

        py: "🐍",

        txt: "📄",

        md: "📝",

        xml: "📋",

        svg: "🖼️",

        png: "🖼️",
        jpg: "🖼️",
        jpeg: "🖼️",
        gif: "🖼️",

        default: "📄"

    };

    return icons[extension] || icons.default;

}


// ============================================================
// TIPO DO ARQUIVO
// ============================================================

function getFileType(fileName) {

    const extension =
        fileName
            .split(".")
            .pop()
            .toLowerCase();

    const types = {

        html: "HTML",
        htm: "HTML",

        css: "CSS",

        js: "JAVASCRIPT",
        mjs: "JAVASCRIPT",

        py: "PYTHON",

        json: "JSON",

        txt: "TEXT",

        md: "MARKDOWN",

        xml: "XML",

        svg: "SVG"

    };

    return types[extension] || "TEXT";

}


// ============================================================
// RENDERIZAR EXPLORADOR
// ============================================================

function renderFileList() {

    fileList.innerHTML = "";

    const files =
        Object.keys(project.files)
            .sort((a, b) => {

                // index.html primeiro
                if (a === "index.html") return -1;
                if (b === "index.html") return 1;

                return a.localeCompare(b);

            });


    files.forEach(fileName => {

        const item = document.createElement("div");

        item.className =
            "file-item" +
            (
                fileName === project.activeFile
                    ? " active"
                    : ""
            );


        item.dataset.file = fileName;


        const icon = document.createElement("span");

        icon.className = "file-icon";
        icon.textContent = getFileIcon(fileName);


        const name = document.createElement("span");

        name.className = "file-name";
        name.textContent = fileName;


        item.appendChild(icon);
        item.appendChild(name);


        // ABRIR ARQUIVO
        item.addEventListener("click", () => {

            openFile(fileName);

        });


        // MENU CONTEXTO
        item.addEventListener("contextmenu", event => {

            event.preventDefault();

            contextFile = fileName;

            contextMenu.style.left =
                event.clientX + "px";

            contextMenu.style.top =
                event.clientY + "px";

            contextMenu.classList.remove("hidden");

        });


        fileList.appendChild(item);

    });

}


// ============================================================
// RENDERIZAR ABAS
// ============================================================

function renderTabs() {

    tabsContainer.innerHTML = "";


    project.openFiles.forEach(fileName => {

        // Arquivo pode ter sido excluído
        if (!project.files.hasOwnProperty(fileName)) {
            return;
        }


        const tab = document.createElement("div");

        tab.className =
            "tab" +
            (
                fileName === project.activeFile
                    ? " active"
                    : ""
            );


        const icon = document.createElement("span");

        icon.textContent = getFileIcon(fileName);


        const name = document.createElement("span");

        name.textContent = fileName;


        const close = document.createElement("span");

        close.className = "tab-close";
        close.textContent = "×";


        tab.appendChild(icon);
        tab.appendChild(name);
        tab.appendChild(close);


        // TROCAR ABA
        tab.addEventListener("click", () => {

            openFile(fileName);

        });


        // FECHAR ABA
        close.addEventListener("click", event => {

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

    if (!project.files.hasOwnProperty(fileName)) {
        return;
    }


    // Salva arquivo anterior
    saveCurrentEditorContent();


    // Adiciona aba se ainda não existe
    if (!project.openFiles.includes(fileName)) {

        project.openFiles.push(fileName);

    }


    project.activeFile = fileName;


    // Carrega conteúdo
    codeEditor.value = project.files[fileName];


    // Atualiza interface
    fileTypeStatus.textContent =
        getFileType(fileName);

    renderFileList();
    renderTabs();

    updateLineNumbers();
    updateCursorPosition();

    autoSave();

}


// ============================================================
// FECHAR ABA
// ============================================================

function closeTab(fileName) {

    if (project.openFiles.length === 1) {
        return;
    }


    const index =
        project.openFiles.indexOf(fileName);


    project.openFiles.splice(index, 1);


    if (project.activeFile === fileName) {

        const nextFile =
            project.openFiles[
                Math.max(0, index - 1)
            ];

        project.activeFile = nextFile;

        codeEditor.value =
            project.files[nextFile];

        fileTypeStatus.textContent =
            getFileType(nextFile);

        updateLineNumbers();
        updateCursorPosition();

    }


    renderTabs();
    renderFileList();

    saveProject(false);

}


// ============================================================
// SALVAR EDITOR ATUAL
// ============================================================

function saveCurrentEditorContent() {

    const activeFile = project.activeFile;

    if (!activeFile) {
        return;
    }

    project.files[activeFile] =
        codeEditor.value;

}


// ============================================================
// NUMERAÇÃO DE LINHAS
// ============================================================

function updateLineNumbers() {

    const lineCount =
        codeEditor.value.split("\n").length;


    let numbers = "";


    for (let i = 1; i <= lineCount; i++) {

        numbers += i + "\n";

    }


    lineNumbers.textContent = numbers;

}


// ============================================================
// POSIÇÃO DO CURSOR
// ============================================================

function updateCursorPosition() {

    const position =
        codeEditor.selectionStart;


    const beforeCursor =
        codeEditor.value.substring(0, position);


    const lines =
        beforeCursor.split("\n");


    const line =
        lines.length;


    const column =
        lines[lines.length - 1].length + 1;


    cursorPosition.textContent =
        `Ln ${line}, Col ${column}`;

}


// ============================================================
// SCROLL SINCRONIZADO
// ============================================================

codeEditor.addEventListener("scroll", () => {

    lineNumbers.scrollTop =
        codeEditor.scrollTop;

});


// ============================================================
// EVENTOS DO EDITOR
// ============================================================

codeEditor.addEventListener("input", () => {

    saveCurrentEditorContent();

    updateLineNumbers();

    updateCursorPosition();

    autoSave();

});


codeEditor.addEventListener(
    "keyup",
    updateCursorPosition
);


codeEditor.addEventListener(
    "click",
    updateCursorPosition
);


// TAB PARA INDENTAÇÃO
codeEditor.addEventListener("keydown", event => {

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
            codeEditor.selectionEnd =
            start + 4;


        saveCurrentEditorContent();

        updateLineNumbers();

        autoSave();

    }


    // CTRL + S
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s"
    ) {

        event.preventDefault();

        saveCurrentEditorContent();

        saveProject();

    }

});


// ============================================================
// CRIAR NOVO ARQUIVO
// ============================================================

function createNewFile() {

    const fileName =
        newFileName.value.trim();


    if (!fileName) {

        newFileName.focus();

        return;

    }


    if (project.files.hasOwnProperty(fileName)) {

        alert("Já existe um arquivo com esse nome.");

        return;

    }


    project.files[fileName] =
        getDefaultFileContent(fileName);


    project.openFiles.push(fileName);


    closeFileModal();

    renderFileList();

    openFile(fileName);

    saveProject(false);


    addConsole(
        `Arquivo criado: ${fileName}`,
        "success"
    );

}


// ============================================================
// CONTEÚDO PADRÃO
// ============================================================

function getDefaultFileContent(fileName) {

    const extension =
        fileName
            .split(".")
            .pop()
            .toLowerCase();


    const templates = {

        html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>Novo Projeto</title>
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
    "name": "Meu Projeto",
    "version": "1.0.0"
}`,

        txt: "",

        md: `# Novo arquivo

Escreva aqui...`

    };


    return templates[extension] || "";

}


// ============================================================
// MODAL
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


// ENTER NO MODAL
newFileName.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        createNewFile();
    }

});


// TEMPLATES
document.querySelectorAll(".file-template")
    .forEach(button => {

        button.addEventListener("click", () => {

            newFileName.value =
                button.dataset.file;

            newFileName.focus();

        });

    });


// ============================================================
// RENOMEAR ARQUIVO
// ============================================================

function openRenameModal(fileName) {

    if (!fileName) {
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


    if (!renameTarget || !newName) {
        return;
    }


    if (
        newName !== renameTarget &&
        project.files.hasOwnProperty(newName)
    ) {

        alert("Já existe um arquivo com esse nome.");

        return;

    }


    const oldName = renameTarget;

    const content =
        project.files[oldName];


    delete project.files[oldName];


    project.files[newName] = content;


    // Atualiza abas
    project.openFiles =
        project.openFiles.map(fileName => {

            return fileName === oldName
                ? newName
                : fileName;

        });


    // Atualiza arquivo ativo
    if (project.activeFile === oldName) {

        project.activeFile = newName;

    }


    closeRenameModal();

    renderFileList();
    renderTabs();

    fileTypeStatus.textContent =
        getFileType(project.activeFile);

    saveProject(false);


    addConsole(
        `Arquivo renomeado: ${oldName} → ${newName}`,
        "success"
    );

}


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
    event => {

        if (event.key === "Enter") {
            renameFile();
        }

    }
);


// ============================================================
// EXCLUIR ARQUIVO
// ============================================================

function deleteFile(fileName) {

    if (!fileName) {
        return;
    }


    const confirmDelete =
        confirm(
            `Deseja excluir "${fileName}"?`
        );


    if (!confirmDelete) {
        return;
    }


    const files =
        Object.keys(project.files);


    if (files.length <= 1) {

        alert(
            "O projeto precisa ter pelo menos um arquivo."
        );

        return;

    }


    delete project.files[fileName];


    project.openFiles =
        project.openFiles.filter(
            file => file !== fileName
        );


    // Se arquivo ativo foi excluído
    if (project.activeFile === fileName) {

        const nextFile =
            project.openFiles[0] ||
            Object.keys(project.files)[0];


        project.activeFile = nextFile;

        codeEditor.value =
            project.files[nextFile];

        fileTypeStatus.textContent =
            getFileType(nextFile);

        updateLineNumbers();
        updateCursorPosition();

    }


    renderFileList();
    renderTabs();

    saveProject(false);


    addConsole(
        `Arquivo excluído: ${fileName}`,
        "warn"
    );

}


// ============================================================
// MENU CONTEXTO
// ============================================================

renameFileBtn.addEventListener("click", () => {

    contextMenu.classList.add("hidden");

    openRenameModal(contextFile);

});


deleteFileBtn.addEventListener("click", () => {

    contextMenu.classList.add("hidden");

    deleteFile(contextFile);

});


document.addEventListener("click", event => {

    if (!contextMenu.contains(event.target)) {

        contextMenu.classList.add("hidden");

    }

});


// ============================================================
// PREVIEW
// ============================================================

function runPreview() {

    saveCurrentEditorContent();

    saveProject(false);


    const html =
        project.files["index.html"] || "";

    const css =
        project.files["style.css"] || "";

    const js =
        project.files["script.js"] || "";


    if (!html) {

        addConsole(
            "Nenhum index.html encontrado.",
            "error"
        );

        return;

    }


    // Remove links externos para os arquivos principais
    let finalHtml = html;


    // Injeta CSS
    const styleTag =
        `<style>
${css}
</style>`;


    if (finalHtml.includes("</head>")) {

        finalHtml =
            finalHtml.replace(
                "</head>",
                `${styleTag}</head>`
            );

    } else {

        finalHtml =
            styleTag + finalHtml;

    }


    // Injeta JavaScript
    const scriptTag =
        `<script>
${js}
<\/script>`;


    if (finalHtml.includes("</body>")) {

        finalHtml =
            finalHtml.replace(
                "</body>",
                `${scriptTag}</body>`
            );

    } else {

        finalHtml += scriptTag;

    }


    previewFrame.srcdoc = finalHtml;


    addConsole(
        "Preview executado com sucesso.",
        "success"
    );

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


openPreviewBtn.addEventListener("click", () => {

    const previewContent =
        previewFrame.srcdoc;


    const newWindow =
        window.open("", "_blank");


    if (!newWindow) {

        addConsole(
            "O navegador bloqueou a nova janela.",
            "error"
        );

        return;

    }


    newWindow.document.open();

    newWindow.document.write(
        previewContent
    );

    newWindow.document.close();

});


// ============================================================
// CONSOLE
// ============================================================

function addConsole(message, type = "info") {

    const item =
        document.createElement("div");


    item.className =
        `console-message ${type}`;


    item.innerHTML =
        `<span>›</span> ${escapeHtml(message)}`;


    consoleOutput.appendChild(item);


    consoleOutput.scrollTop =
        consoleOutput.scrollHeight;

}


function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


clearConsoleBtn.addEventListener("click", () => {

    consoleOutput.innerHTML = "";

    addConsole(
        "Console limpo.",
        "info"
    );

});


// ============================================================
// NOME DO PROJETO
// ============================================================

projectNameInput.addEventListener("input", () => {

    project.name =
        projectNameInput.value;


    projectTreeName.textContent =
        project.name.toUpperCase();


    autoSave();

});


// ============================================================
// SALVAR
// ============================================================

saveProjectBtn.addEventListener("click", () => {

    saveCurrentEditorContent();

    saveProject();

});


// ============================================================
// TECLAS GLOBAIS
// ============================================================

document.addEventListener("keydown", event => {

    // CTRL + ENTER = RUN
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "Enter"
    ) {

        event.preventDefault();

        runPreview();

    }


    // ESC = FECHAR MODAIS
    if (event.key === "Escape") {

        closeFileModal();

        closeRenameModal();

        contextMenu.classList.add("hidden");

    }

});


// ============================================================
// INICIALIZAÇÃO
// ============================================================

function initialize() {

    loadProject();


    // Garante que existe arquivo ativo
    if (
        !project.activeFile ||
        !project.files.hasOwnProperty(
            project.activeFile
        )
    ) {

        project.activeFile =
            Object.keys(project.files)[0];

    }


    // Garante openFiles
    project.openFiles =
        project.openFiles.filter(
            file => project.files.hasOwnProperty(file)
        );


    if (project.openFiles.length === 0) {

        project.openFiles = [
            project.activeFile
        ];

    }


    projectNameInput.value =
        project.name || "Meu Projeto";


    projectTreeName.textContent =
        (project.name || "Meu Projeto")
            .toUpperCase();


    codeEditor.value =
        project.files[project.activeFile];


    fileTypeStatus.textContent =
        getFileType(project.activeFile);


    renderFileList();

    renderTabs();

    updateLineNumbers();

    updateCursorPosition();


    addConsole(
        "Projeto carregado.",
        "success"
    );


    // Executa o projeto inicial
    setTimeout(runPreview, 300);

}


initialize();
