import { initComunidad } from "./components/comunidad/comunidad.js";
import { initExplorar } from "./components/explorar/explorar.js";
import { initPerfil } from "./components/perfil/perfil.js";
import { books } from "./data/books.js";

const componentPaths = [
  "src/components/explorar/explorar.html",
  "src/components/comunidad/comunidad.html",
  "src/components/perfil/perfil.html",
];

async function loadComponent(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }

  return response.text();
}

async function renderComponents() {
  const appRoot = document.querySelector("#appRoot");
  const html = await Promise.all(componentPaths.map(loadComponent));
  appRoot.innerHTML = html.join("");
}

function setActiveView(viewName) {
  const views = document.querySelectorAll("[data-view]");
  const viewButtons = document.querySelectorAll("[data-view-target]");

  views.forEach((view) => {
    const isActive = view.dataset.view === viewName;
    view.hidden = !isActive;
    view.classList.toggle("active", isActive);
  });

  viewButtons.forEach((button) => {
    const isActive = button.dataset.viewTarget === viewName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

function initNavigation() {
  const viewButtons = document.querySelectorAll("[data-view-target]");

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.viewTarget);
    });
  });
}

async function initApp() {
  try {
    await renderComponents();
    initNavigation();
    initExplorar({ books });
    initComunidad({ books });
    initPerfil();
    setActiveView("explorar");
  } catch (error) {
    document.querySelector("#appRoot").innerHTML = `
      <section class="view active">
        <div class="feed-panel">
          <h1>No se pudieron cargar los componentes</h1>
          <p>${error.message}</p>
        </div>
      </section>
    `;
  }
}

initApp();
