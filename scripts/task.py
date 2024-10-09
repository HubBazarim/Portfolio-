# Passo a passo do projeto
# Passo 1: Entrar no sistema da empresa
import subprocess
import pandas as pd
# https://dlp.hashtagtreinamentos.com/python/intensivao/login

import pyautogui
import time
pyautogui.FAILSAFE = True

# pyautogui.write -> escrever um texto
# pyautogui.press -> apertar 1 tecla
# pyautogui.click -> clicar em algum lugar da tela
# pyautogui.hotkey -> combinação de teclas
pyautogui.PAUSE = 0.2

# Abra o navegador diretamente com o link
subprocess.run(
    ['start', 'https://dlp.hashtagtreinamentos.com/python/intensivao/login'], shell=True)
time.sleep(3)

# Passo 2: Fazer login
# selecionar o campo de email
pyautogui.click(x=881, y=401)
# escrever o seu email
pyautogui.write("testedeemail@gmail.com")
pyautogui.press("tab")  # passando pro próximo campo
pyautogui.write("senhadeteste")
pyautogui.click(x=958, y=559)  # clique no botao de login
time.sleep(2)

# Passo 3: Importar a base de produtos pra cadastrar

tabela = pd.read_csv("produtos.csv")

print(tabela)

# Passo 4: Cadastrar um produto
for linha in tabela.index:
    # clicar no campo de código
    pyautogui.click(x=894, y=288)
    # pegar da tabela o valor do campo que a gente quer preencher
    codigo = tabela.loc[linha, "codigo"]
    # preencher o campo
    pyautogui.write(str(codigo))
    # passar para o proximo campo
    pyautogui.press("tab")
    # preencher o campo
    pyautogui.write(str(tabela.loc[linha, "marca"]))
    pyautogui.press("tab")
    pyautogui.write(str(tabela.loc[linha, "tipo"]))
    pyautogui.press("tab")
    pyautogui.write(str(tabela.loc[linha, "categoria"]))
    pyautogui.press("tab")
    pyautogui.write(str(tabela.loc[linha, "preco_unitario"]))
    pyautogui.press("tab")
    pyautogui.write(str(tabela.loc[linha, "custo"]))
    pyautogui.press("tab")
    obs = tabela.loc[linha, "obs"]
    if not pd.isna(obs):
        pyautogui.write(str(tabela.loc[linha, "obs"]))
    pyautogui.press("tab")
    pyautogui.press("enter")  # cadastra o produto (botao enviar)
    # dar scroll de tudo pra cima
    pyautogui.scroll(5000)
    # Passo 5: Repetir o processo de cadastro até o fim
