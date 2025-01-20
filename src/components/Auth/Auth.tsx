"use client"
import React from 'react'
import { useForm, SubmitHandler } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import Image from 'next/image'
import { Button } from '../ui/button'
import { useLoginUserMutation } from '@/redux/api/auth'
import { setUser } from '@/redux/slices/user'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/redux/hook'
import { useToast } from '@/hooks/use-toast'


type LoginFormInputs = {
    email: string,
    password: string
}

interface IAuth {
    isLogin?: boolean
}

const Auth: React.FC<IAuth> = ({ isLogin = true }) => {
    const form = useForm<LoginFormInputs>({
        defaultValues: {
            email: "",
            password: ""
        }
    })
    const router = useRouter()
    const { toast } = useToast();

    const dispatch = useAppDispatch();

    const [loginUserApi] = useLoginUserMutation()

    const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
        try {
            const res = await loginUserApi({ email: data.email, password: data.password }).unwrap();
            dispatch(setUser(res?.data));
            router.push('/');
        } catch (error: any) {
            if (error.status === 401) toast({
                title: 'Invalid email or password',
                description: "Please enter a valid email and password.",
                variant: "destructive"
            });
        }
    }


    return (
        <div className='flex justify-center items-center h-svh px-4 sm:px-0'>
            <Card className="mx-auto max-w-sm w-full ce-auth">
                <CardHeader>
                    <div className="flex items-center">
                        <Image src={"/images/logo.png"} width={50} height={50} className="rounded-full mr-4" alt="CL" />
                        <CardTitle className="text-xl">{isLogin ? "Login" : "Welcome"} to Etrends AMC</CardTitle>
                    </div>
                    <CardDescription className="text-center">
                        {isLogin ? "Enter your credentials to log in." : "Fill in your details to create an account."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form} >
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <br />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type='password' {...field}  />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <br />
                            <Button type='submit' className='w-full'>Login</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

export default Auth