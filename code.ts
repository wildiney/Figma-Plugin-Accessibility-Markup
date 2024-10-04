let initialNumber = "1"

figma.showUI(__html__, { width: 300, height: 400, themeColors: true });

figma.ui.onmessage = async (msg: { type: string, marker?: string, value?: number }) => {
  await figma.loadAllPagesAsync()

  msg.marker != null ? console.log("marker", msg.marker) : null

  if (msg.type === 'change-number') {
    if (msg.value != null) {
      const currentValue = msg.value
      initialNumber = currentValue.toString()
    }

  }
  if (msg.type === 'insert-markup-frame') {
    const selectedFrame = figma.currentPage.selection[0]
    let instanceName = null
    switch (msg.marker) {
      case "top_left":
        instanceName = "Posição do marcador=↖️"
        break
      case "top_center":
        instanceName = "Posição do marcador=↑"
        break
      case "top_right":
        instanceName = "Posição do marcador=↗"
        break
      case "middle_left":
        instanceName = "Posição do marcador=←"
        break
      case "middle_right":
        instanceName = "Posição do marcador=→"
        break
      case "bottom_left":
        instanceName = "Posição do marcador=↙"
        break
      case "bottom_center":
        instanceName = "Posição do marcador=↓"
        break
      case "bottom_right":
        instanceName = "Posição do marcador=↘"
        break
      default:
        instanceName = "Posição do marcador=→"

    }

    if (
      selectedFrame && selectedFrame.type === "FRAME" ||
      selectedFrame && selectedFrame.type === "INSTANCE" ||
      selectedFrame && selectedFrame.type === "TEXT") {
      const componentSet = figma.root.findOne(node => node.name === "Specs-Component" && node.type === "COMPONENT_SET") as ComponentSetNode
      if (componentSet) {
        const variant = componentSet.findOne(node => node.name === instanceName && node.type === "COMPONENT") as ComponentNode

        if (variant) {
          const instance = variant.createInstance()
          instance.x = selectedFrame.absoluteTransform[0][2]
          instance.y = selectedFrame.absoluteTransform[1][2]
          instance.resize(selectedFrame.width, selectedFrame.height)
          figma.currentPage.appendChild(instance)
          const textNode = instance.findOne(node => node.type === "TEXT" && node.characters === "0") as TextNode
          if (textNode) {
            await figma.loadFontAsync(textNode.fontName as FontName)
            const newText = initialNumber
            textNode.characters = newText.toString()
          }

          figma.notify("Instância criada com sucesso")
        } else {
          figma.notify("Variante não encontrada")
        }
      } else {
        figma.notify("CompnentSet não encontrada")
      }
    } else {
      figma.notify("Selecione um frame ou instância")
    }
    if (initialNumber.indexOf(".") === -1) {
      initialNumber = (parseFloat(initialNumber) + 1).toString()
    } else {
      const splitedNumber = initialNumber.split(".")
      console.log(splitedNumber)
      const lastItem = parseInt(splitedNumber[splitedNumber.length - 1]) + 1
      console.log(lastItem)
      splitedNumber[splitedNumber.length - 1] = lastItem.toString()
      console.log(splitedNumber[-1])
      initialNumber = splitedNumber.join(".")
    }
    figma.ui.postMessage({ type: 'change-number', newValue: initialNumber });
  }


};
