import { ISettingsForm } from "./type"

export const updateBlock = async (blockId: number | string, content: string | false, properties?: Record<string, any>) => {
  const block = await logseq.Editor.getBlock(blockId)
  if (!block) {
    logseq.App.showMsg('Block not found', 'error')
    return Promise.reject(new Error('Block not found'))
  }
  if (content) {
    // propteties param not working
    await logseq.Editor.updateBlock(block.uuid, content)
  }
  const upsertBlockPropertyPromises = Object.keys(properties || {}).map(key => logseq.Editor.upsertBlockProperty(block.uuid, key, properties?.[key]))
  return Promise.allSettled(upsertBlockPropertyPromises)
}

export const moveBlockToNewPage = async (blockId: number, pageName: string) => {
  const block = await getBlockData({ id: blockId })
  if (!block) return logseq.App.showMsg('moveBlockToNewPage: Block not found', 'error')
  const page = await logseq.Editor.createPage(pageName)
  if (!page) return logseq.App.showMsg('Create page failed', 'error')
  await logseq.Editor.moveBlock(block.uuid, page.uuid)
  return await getBlockData({ uuid: block.uuid })
}
export const moveBlockToSpecificBlock = async (srcBlockId: number, targetPageName: string, targetBlockContent: string) => {
  const srcBlock = await getBlockData({ id: srcBlockId })
  if (!srcBlock) return logseq.App.showMsg('moveBlockToSpecificBlock: Block not found', 'error')
  let targetPage = await getPageData({ originalName: targetPageName })
  if (!targetPage) targetPage = await logseq.Editor.createPage(targetPageName)
  let targetBlock = await getSpecificBlockByContent(targetPageName, targetBlockContent)
  if (!targetBlock) targetBlock = await logseq.Editor.insertBlock(targetPageName, targetBlockContent, { before: true, isPageBlock: true })
  if (targetBlock) {
    await logseq.Editor.moveBlock(srcBlock.uuid, targetBlock.uuid, { children: true })
  }
  return await getBlockData({ uuid: srcBlock.uuid })
}
export const createBlockToSpecificBlock = async (targetPageName: string, targetBlockContent: string, blockContent: string, blockProperties: Record<string, any> = {}) => {
  let targetPage = await getPageData({ originalName: targetPageName })
  if (!targetPage) targetPage = await logseq.Editor.createPage(targetPageName)
  let targetBlock = await getSpecificBlockByContent(targetPageName, targetBlockContent)
  if (!targetBlock) targetBlock = await logseq.Editor.insertBlock(targetPageName, targetBlockContent, { before: true, isPageBlock: true })
  if (targetBlock) {
    return await logseq.Editor.insertBlock(targetBlock.uuid, blockContent, { isPageBlock: false, properties: blockProperties, sibling: false, before: false })
  }
  return null
}

// https://logseq.github.io/plugins/interfaces/IEditorProxy.html#getBlock
const blockDataCacheMap = new Map()
export const getBlockData = async (params: { id?: number; uuid?: string }, useCache = false) => {
  const { id, uuid } = params
  const key = id || uuid
  if (!key) return Promise.reject(new Error('getBlockData: id or uuid is required'))
  if (useCache && blockDataCacheMap.has(key)) return blockDataCacheMap.get(key)
  const block = await logseq.Editor.getBlock(key)
  if (!block) return null
  const { id: _id, uuid: _uuid } = block
  blockDataCacheMap.set(_id, block)
  blockDataCacheMap.set(_uuid, block)
  return block
}

// https://logseq.github.io/plugins/interfaces/IEditorProxy.html#getPage
const pageDataCacheMap = new Map()
export const getPageData = async (srcPage: { id?: number; uuid?: string; originalName?: string }, opts?: Partial<{ includeChildren: boolean }>, useCache = false) => {
  const { id, uuid, originalName } = srcPage
  const key = id || uuid || originalName
  if (!key) return Promise.reject(new Error('getPageData: id, uuid or pageOriginalName is required'))
  if (useCache && pageDataCacheMap.has(key)) return pageDataCacheMap.get(key)
  const page = await logseq.Editor.getPage(key, opts)
  if (!page) return null
  const { id: _id, uuid: _uuid, originalName: _originName } = page
  pageDataCacheMap.set(_id, page)
  pageDataCacheMap.set(_uuid, page)
  pageDataCacheMap.set(_originName, page)
  return page
}

export const getCurrentTheme = async () => {
  const logseqTheme = import.meta.env.DEV ? 'light' : await logseq.App.getStateFromStore<'dark' | 'light'>('ui/theme')
  const _theme = logseq.settings?.theme === 'auto' ? logseqTheme : logseq.settings?.theme
  const lightTheme = (logseq.settings?.lightThemeType as ISettingsForm['lightThemeType']) || 'green'
  return _theme === 'dark' ? 'dark' : lightTheme
}

export const getSpecificBlockByContent = async (pageName: string, blockContent: string) => {
  const blocks = await logseq.Editor.getPageBlocksTree(pageName)
  const block = blocks.find(block => block.content === blockContent) || null
  console.log('[faiz:] === getSpecificBlockByContent xxx', blocks, block)
  return block
}