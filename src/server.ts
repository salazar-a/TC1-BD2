import { app } from "./app.js";

const port = 3000;

app.listen(port, () => {
    console.log(`Server available on http://localhost:${port}`);
});