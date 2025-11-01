// assets/js/router.js
const routes = {};
const appRoot = document.getElementById('app-root');

export function registerRoute(path, component) {
    routes[path] = component;
}

export function navigate(path) {
    // Setting the hash triggers the 'hashchange' event listener
    window.location.hash = path;
}

// This is the core update: Handle dynamic paths like '#/space/:id'
function findMatchingRoute(path) {
    for (const routePath in routes) {
        const paramNames = [];
        // Convert routePath to a regex, e.g., '#/space/:id' -> /^#\/space\/([^\/]+)$/
        const regexPath = routePath.replace(/:([^\/]+)/g, (_, paramName) => {
            paramNames.push(paramName);
            return '([^\/]+)';
        });

        const regex = new RegExp(`^${regexPath}$`);
        const match = path.match(regex);

        if (match) {
            const params = match.slice(1); // The captured values
            const component = routes[routePath];
            // Return both the component factory and the extracted params
            return { component, params }; 
        }
    }
    return { component: null, params: [] }; // No match found
}

async function handleRouting() {
    const path = window.location.hash || '#/';
    const { component, params } = findMatchingRoute(path);

    if (component) {
        // If the component is a factory function (takes params), call it.
        // Otherwise, it's a simple object.
        const componentInstance = typeof component === 'function' ? component(...params) : component;
        
        if (componentInstance && typeof componentInstance.render === 'function') {
            appRoot.innerHTML = await componentInstance.render();
            if (typeof componentInstance.addEventListeners === 'function') {
                componentInstance.addEventListeners();
            }
        }
    } else {
        // Fallback to home page if no route matches
        const homeComponent = routes['#/'];
        if(homeComponent) {
             const homeInstance = typeof homeComponent === 'function' ? homeComponent() : homeComponent;
             appRoot.innerHTML = await homeInstance.render();
             homeInstance.addEventListeners();
        } else {
            appRoot.innerHTML = `<p class="p-4 text-text-secondary">Error: Route not found for ${path}</p>`;
        }
    }
}

window.addEventListener('hashchange', handleRouting);

// Export navigate for components and handleRouting for main.js initialization
export { handleRouting };