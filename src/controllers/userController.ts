import {Request, Response} from 'express'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

import { generateToken } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

export const criarContaUsuario = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {

        if(!email || !password ){
            return res.status(400).json({ message:'faltando dados: email ou senha.' })
        }

        // email ou usuário já existente        
        const emailUnique = await prisma.user.findUnique({ where: {email} });
        if(emailUnique){
            return res.status(409).json({ message: "esse email já está sendo usado." })
        }

        // hash de senha - segurança
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // criando usuário e armazenando no DB
        const create = await prisma.user.create({
            data: {
                email,
                password: passwordHash
            }
        });

        if(!create){
            return res.status(400).json({ message: 'ocorreu um erro ao criar a conta.' })
        }

        return res.status(201).json({ message: 'conta criada. faça login!' });
    } catch (err) {
       console.log('erro no console: ', err);
       return res.status(500).json({ message: 'ocorreu um erro ao criar a conta.' })
    }
}

export const loginConta = async (req: Request, res: Response) => {
    const {email, password} = req.body;

    try{
        const conta = await prisma.user.findUnique({ where: {email} });

        if(!conta){
            return res.status(404).json({ message: 'conta não encontrada. crie uma!' })
        }

        // verifica senha - hash de senha
        const compareHash = await bcrypt.compare(password, conta.password);
        if(!compareHash){
            return res.status(401).json({ message: 'senha incorreta. esqueceu a senha?' })
        }

        const token = generateToken({email: conta.email, role: conta.role})

        return res.status(200).json({ message: 'login com sucesso.', token })
    }catch(err){
        console.log(err);
        return res.status(500).json({ message: 'ocorreu um erro ao entrar na conta.' }) 
    }
}

