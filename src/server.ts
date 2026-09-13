import express from "express";

const app = express();
const port = 3000;

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok"});
});

app.listen(port, () => {
    console.log('Servidor disponible en http://localhost:${port}');
});