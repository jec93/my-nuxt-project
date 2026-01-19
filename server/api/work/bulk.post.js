import {prisma} from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const ids = Array.isArray(body?.ids) ? body.ids : []
    const action = String(body?.action || 'complete')

    if(!ids.length) return {ok: true, count: 0}

    const idBigints = ids.map((x) => BigInt(String(x)))

    // 상태 제한 : 완료는 대상 제외 (서버에서도 한 번 더 안전장치)
    const allowedStatuses = ['대기', '진행']

    let nextStatus = '완료'
    if(action === 'progress') nextStatus = '진행'
    if(action === 'wait') nextStatus = '대기'

    const res = await prisma.workItem.updateMany({
        where : {
            id : {in : idBigints },
            status : {in : allowedStatuses},
        },
        data : {status : nextStatus},
    })

    return { ok : true, count : res.count, nextStatus }
})