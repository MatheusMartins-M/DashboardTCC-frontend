import { readFileSync, writeFileSync } from "node:fs";

// O scanner do Sonar roda em Linux: caminhos gerados no Windows precisam usar "/".
const arquivo = new URL("../coverage/lcov.info", import.meta.url);
const conteudo = readFileSync(arquivo, "utf8");
writeFileSync(arquivo, conteudo.replace(/^SF:(.*)$/gm, (_, caminho) => `SF:${caminho.replaceAll("\\", "/")}`));
