// utils/printRoutes.js

/**
 * Affiche élégamment les routes d'une instance de Rest.
 * @param {import('./rest').Rest} rest - Instance de l'application REST
 */
export function printRoutes(rest) {
    const pad = (str, len) => str.length >= len ? str : str + " ".repeat(len - str.length);
    const color = (txt, code) => `\x1b[${code}m${txt}\x1b[0m`;
    const bold = txt => color(txt, "1");
    const green = txt => color(txt, "32");
    const cyan = txt => color(txt, "36");
    const yellow = txt => color(txt, "33");
    const magenta = txt => color(txt, "35");
    const gray = txt => color(txt, "90");
    const blue = txt => color(txt, "34");
    
    const routes = rest.getRoutes();

    if (!routes.length) {
        console.log(gray("🤷‍♂️ No routes defined."));
        return;
    }

    const maxMethodLen = Math.max(...routes.map(r => r.method.length), 6);
    const maxPathLen = Math.max(...routes.map(r => r.path.length), 10);

    console.log(bold("\n🧭 REST API Routes Overview:\n"));
    console.log(`${pad(bold("METHOD"), maxMethodLen)}  ${pad(bold("PATH"), maxPathLen)}  ${bold("MIDDLEWARES")} ${gray("(Count)")}`);
    console.log(gray("-".repeat(maxMethodLen + maxPathLen + 30)));

    routes.forEach(route => {
        
        
        const middlewares = rest.middlewares.filter(mw => {
            const regexPattern = mw.path
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                .replace(/\\\*/g, '.+')
                .replace(/:([\w]+)/g, '([^/]+)');
            const regex = new RegExp("^" + regexPattern + "(/.*)?$");
            return regex.test(route.path);
        });

        const method = green(pad(route.method, maxMethodLen));
        const path = yellow(pad(route.path, maxPathLen));

        const middlewareList = middlewares.map(m => cyan(m.path)).join(", ");
        const mwCount = gray(`(${middlewares.length})`);
        const isDynamic = route.path.includes(":") || route.path.includes("*");
        const flag = isDynamic ? magenta("🔀") : blue("📄");

        console.log(`${flag} ${method}  ${path}  ${middlewareList} ${mwCount}`);
    });

    console.log(gray(`\n📊 Total: ${routes.length} route${routes.length > 1 ? "s" : ""}\n`));
}
