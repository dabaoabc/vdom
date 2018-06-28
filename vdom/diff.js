import { api, isArray} from '../util/index'
import { createEle, updateEle } from './index'

function sameVnode(oldVnode, vnode){
	return vnode.key === oldVnode.key && vnode.sel === oldVnode.sel
}
function createKeyToOldIdx (children, beginIdx, endIdx) {
    var i, map = {}, key, ch
    for (i = beginIdx; i <= endIdx; ++i) {
        ch = children[i]
        if (ch != null) {
            key = ch.key
            if (key !== null)
                map[key] = i
        }
    }
    return map
}
function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
        for ( ;startIdx <= endIdx; ++startIdx) {
            var ch = vnodes[startIdx]
            if (ch != null) {
                    api.removeChild(parentElm, ch.el)
            }
        }
    }
function addVnodes (parentElm, before, vnodes, startIdx, endIdx) {
        for ( ;startIdx <= endIdx; ++startIdx) {
            var ch = vnodes[startIdx]
            if (ch != null) {
                api.insertBefore(parentElm, createEle(ch).el, before)
            }
        }
    }    
function patchVnode (oldVnode, vnode) {
	const el = vnode.el = oldVnode.el
    let i, oldCh = oldVnode.children, ch = vnode.children
    if (oldVnode === vnode) return
    if (oldVnode.text !== null && vnode.text !== null && oldVnode.text !== vnode.text) {
        api.setTextContent(el, vnode.text)
    }else {
        updateEle(el, vnode, oldVnode)
    	if (oldCh && ch && oldCh !== ch) {
	    	updateChildren(el, oldCh, ch)
	    }else if (ch){
	    	createEle(vnode) //create el's children dom
	    }else if (oldCh){
	    	api.removeChildren(el)
	    }
    }
}

function updateChildren (parentElm, oldCh, newCh) {
	let oldStartIdx = 0, newStartIdx = 0
    let oldEndIdx = oldCh.length - 1
    let oldStartVnode = oldCh[0]
    let oldEndVnode = oldCh[oldEndIdx]
    let newEndIdx = newCh.length - 1
    let newStartVnode = newCh[0]
    let newEndVnode = newCh[newEndIdx]
    let oldKeyToIdx
    let idxInOld
    let elmToMove
    let before
    // 遍历 oldCh 和 newCh 来比较和更新
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            // 一、首先检查 4 种情况，保证 oldStart/oldEnd/newStart/newEnd
            // 这 4 个 vnode 非空，左侧的 vnode 为空就右移下标，右侧的 vnode 为空就左移 下标。
            if (oldStartVnode == null) {
                oldStartVnode = oldCh[++oldStartIdx] // Vnode might have been moved left
            }else if (oldEndVnode == null) {
                oldEndVnode = oldCh[--oldEndIdx]
            }else if (newStartVnode == null) {
                newStartVnode = newCh[++newStartIdx]
            }else if (newEndVnode == null) {
                newEndVnode = newCh[--newEndIdx]
            /**
             * 二、然后 oldStartVnode/oldEndVnode/newStartVnode/newEndVnode 两两比较，
             * 对有相同 vnode 的 4 种情况执行对应的 patch 逻辑。
             * - 如果同 start 或同 end 的两个 vnode 是相同的（情况 1 和 2），
             *   说明不用移动实际 dom，直接更新 dom 属性／children 即可；
             * - 如果 start 和 end 两个 vnode 相同（情况 3 和 4），
             *   那说明发生了 vnode 的移动，同理我们也要移动 dom。
             */
            // 1. 如果 oldStartVnode 和 newStartVnode 相同（key相同），执行 patch
            }else if (sameVnode(oldStartVnode, newStartVnode)) {
                patchVnode(oldStartVnode, newStartVnode)
                oldStartVnode = oldCh[++oldStartIdx]
                newStartVnode = newCh[++newStartIdx]
            // 2. 如果 oldEndVnode 和 newEndVnode 相同，执行 patch
            }else if (sameVnode(oldEndVnode, newEndVnode)) {
                patchVnode(oldEndVnode, newEndVnode)
                oldEndVnode = oldCh[--oldEndIdx]
                newEndVnode = newCh[--newEndIdx]
            // 3. 如果 oldStartVnode 和 newEndVnode 相同，执行 patch
            }else if (sameVnode(oldStartVnode, newEndVnode)) {
                patchVnode(oldStartVnode, newEndVnode)
            // 把获得更新后的 (oldStartVnode/newEndVnode) 的 dom 右移，移动到
            // oldEndVnode 对应的 dom 的右边。为什么这么右移？
            // （1）oldStartVnode 和 newEndVnode 相同，显然是 vnode 右移了。
            // （2）若 while 循环刚开始，那移到 oldEndVnode.elm 右边就是最右边，是合理的；
            // （3）若循环不是刚开始，因为比较过程是两头向中间，那么两头的 dom 的位置已经是
            //     合理的了，移动到 oldEndVnode.elm 右边是正确的位置；
            // （4）记住，oldVnode 和 vnode 是相同的才 patch，且 oldVnode 自己对应的 dom
            //     总是已经存在的，vnode 的 dom 是不存在的，直接复用 oldVnode 对应的 dom。
                api.insertBefore(parentElm, oldStartVnode.el, api.nextSibling(oldEndVnode.el))
                oldStartVnode = oldCh[++oldStartIdx]
                newEndVnode = newCh[--newEndIdx]
            // 4. 如果 oldEndVnode 和 newStartVnode 相同，执行 patch
            }else if (sameVnode(oldEndVnode, newStartVnode)) {
                patchVnode(oldEndVnode, newStartVnode)
                // 左移
                api.insertBefore(parentElm, oldEndVnode.el, oldStartVnode.el)
                oldEndVnode = oldCh[--oldEndIdx]
                newStartVnode = newCh[++newStartIdx]
            // 三、最后一种情况：4 个 vnode 都不相同，那么我们就要
            // 1. 从 oldCh 数组建立 key --> index 的 map。
            // 2. 只处理 newStartVnode （简化逻辑，有循环我们最终还是会处理到所有 vnode），
            //    以它的 key 从上面的 map 里拿到 index；
            // 3. 如果 index 存在，那么说明有对应的 old vnode，patch 就好了；
            // 4. 如果 index 不存在，那么说明 newStartVnode 是全新的 vnode，直接
            //    创建对应的 dom 并插入。
            }else {
                // 如果 oldKeyToIdx 不存在，创建 old children 中 vnode 的 key 到 index 的
                // 映射，方便我们之后通过 key 去拿下标。
                if (oldKeyToIdx === undefined) {
                    oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
                }
                // 尝试通过 newStartVnode 的 key 去拿下标
                idxInOld = oldKeyToIdx[newStartVnode.key]
                // 下标不存在，说明 newStartVnode 是全新的 vnode。
                if (!idxInOld) {
                    api.insertBefore(parentElm, createEle(newStartVnode).el, oldStartVnode.el)
                    newStartVnode = newCh[++newStartIdx]
                }
                // 下标存在，说明 old children 中有相同 key 的 vnode，
                else {
                    elmToMove = oldCh[idxInOld]
                    // 如果 sel 不同，没办法，只能创建新 dom；
                    if (elmToMove.sel !== newStartVnode.sel) {
                        api.insertBefore(parentElm, createEle(newStartVnode).el, oldStartVnode.el)
                    // type 相同（且key相同），那么说明是相同的 vnode，执行 patch。
                    }else {
                        patchVnode(elmToMove, newStartVnode)
                        oldCh[idxInOld] = null
                        api.insertBefore(parentElm, elmToMove.el, oldStartVnode.el)
                    }
                    newStartVnode = newCh[++newStartIdx]
                }
            }
        }
        // 上面的循环结束后（循环条件有两个），处理可能的未处理到的 vnode。
        // 如果是 new vnodes 里有未处理的（oldStartIdx > oldEndIdx）
        // 说明 old vnodes 先处理完毕）
        if (oldStartIdx > oldEndIdx) {
             // 增加所有新节点
            before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].el
            addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx)
        // 相反，如果 old vnodes 有未处理的，删除 （为处理 vnodes 对应的） 多余的 dom。
        }else if (newStartIdx > newEndIdx) {
            // 删除所有旧节点
            removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
        }
}

export function patch (oldVnode, vnode) {
	if (sameVnode(oldVnode, vnode)) {
		patchVnode(oldVnode, vnode)
	} else {
		const oEl = oldVnode.el
		let parentEle = api.parentNode(oEl)
		createEle(vnode)
		if (parentEle !== null) {
			api.insertBefore(parentEle, vnode.el, api.nextSibling(oEl))
			api.removeChild(parentEle, oldVnode.el)
			oldVnode = null
		}
	}
	return vnode
}