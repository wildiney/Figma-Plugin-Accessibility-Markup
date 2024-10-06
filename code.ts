let initialNumber = "1";

figma.showUI(__html__, { width: 300, height: 400, themeColors: true });

figma.ui.onmessage = async (msg) => {
  // await figma.loadAllPagesAsync();

  const position: { [key: string]: string } = {
    top_left: "Posição do marcador=↖️",
    top_center: "Posição do marcador=↑",
    top_right: "Posição do marcador=↗",
    middle_left: "Posição do marcador=←",
    middle_right: "Posição do marcador=→",
    bottom_left: "Posição do marcador=↙",
    bottom_center: "Posição do marcador=↓",
    bottom_right: "Posição do marcador=↘",
  };

  switch (msg.type) {
    case 'change-number':
      handleNumberChange(msg.value);
      break;
    case 'insert-markup-frame':
      await handleInsertMarkupFrame(msg, position);
      break;
  }
};

function handleNumberChange (value: number | undefined) {
  if (value != null) {
    initialNumber = value.toString();
  }
}

async function handleInsertMarkupFrame (msg: { marker?: string; addSpace?: number }, position: { [key: string]: string }) {
  const selectedFrame = figma.currentPage.selection[0];

  if (!selectedFrame) {
    figma.notify("Nenhum frame ou instância selecionada");
    return;
  }

  const instanceName = msg.marker ? position[msg.marker] : null;

  if (selectedFrame && ["FRAME", "INSTANCE", "TEXT"].includes(selectedFrame.type)) {
    const componentSet = figma.currentPage.findOne(node => node.name === "Specs-Component" && node.type === "COMPONENT_SET") as ComponentSetNode;

    if (componentSet) {
      const variant = componentSet.findOne(node => node.name === instanceName && node.type === "COMPONENT") as ComponentNode;

      if (variant) {
        const instance = variant.createInstance();
        const addSpaceValue = msg.addSpace || 0;

        adjustInstancePosition(instance, selectedFrame, addSpaceValue, msg.marker);
        figma.currentPage.appendChild(instance);

        const textNode = instance.findOne(node => node.type === "TEXT" && node.characters === "0") as TextNode;

        if (textNode) {
          await figma.loadFontAsync(textNode.fontName as FontName);
          textNode.characters = initialNumber;
        }
        initialNumber = incrementNumber(initialNumber)

        incrementNumber(initialNumber.toString())

        figma.notify("Instância criada com sucesso");
      } else {
        figma.notify("Variante não encontrada");
      }
    } else {
      figma.notify("ComponentSet não encontrado");
    }
  }
}

function adjustInstancePosition (
  instance: InstanceNode,
  selectedFrame: FrameNode | InstanceNode | SceneNode,
  addSpaceValue: number,
  marker?: string
) {
  let xAdjust = 0;
  let yAdjust = 0;
  let shouldResizeWidth = true;
  let shouldResizeHeight = true;

  switch (marker) {
    case "top_left":
      xAdjust = -addSpaceValue;
      yAdjust = -addSpaceValue;
      break;
    case "top_center":
      yAdjust = -addSpaceValue;
      shouldResizeWidth = false;
      break;
    case "top_right":
      yAdjust = -addSpaceValue;
      break;
    case "middle_left":
      xAdjust = -addSpaceValue;
      shouldResizeHeight = false; // Não ajusta a altura
      break;
    case "middle_right":
      shouldResizeHeight = false; // Não ajusta a altura
      break;
    case "bottom_left":
      xAdjust = -addSpaceValue;
      break;
    case "bottom_center":
      shouldResizeWidth = false; // Não ajusta a largura
      break;
    case "bottom_right":
      break;
  }

  instance.x = selectedFrame.absoluteTransform[0][2] + xAdjust;
  instance.y = selectedFrame.absoluteTransform[1][2] + yAdjust;

  // Só redimensiona se for necessário
  const newWidth = shouldResizeWidth ? selectedFrame.width + addSpaceValue : selectedFrame.width;
  const newHeight = shouldResizeHeight ? selectedFrame.height + addSpaceValue : selectedFrame.height;

  instance.resize(newWidth, newHeight);
}

function incrementNumber (number: string): string {
  if (number.indexOf(".") === -1) {
    return (parseFloat(number) + 1).toString();
  } else {
    const splitedNumber = number.split(".");
    const lastItem = parseInt(splitedNumber[splitedNumber.length - 1]) + 1;
    splitedNumber[splitedNumber.length - 1] = lastItem.toString();
    return splitedNumber.join(".");
  }
}
