import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const { domain } = getQuery(event)
    if(!domain) return []

    //메뉴 찾기
    let current = await prisma.menu.findFirst({
        where : {domain},
        select : {
            screenKey : true,
            parentKey : true,
            label : true,
            depth : true,
        },
    })

    if(!current) return []

    const chain = [current]

    // parentKey로 추적
    while (current.parentKey) {
        current = await prisma.menu.findUnique({
            where : { screenKey : current.parentKey },
            select : {
                screenKey : true,
                parentKey : true,
                label : true,
                depth : true,
            },
        })
        if(current) chain.push(current)
    }

    return chain.reverse()
})