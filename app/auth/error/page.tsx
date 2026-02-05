import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-destructive">
            Erro de autenticacao
          </CardTitle>
          <CardDescription>
            Algo deu errado durante o processo de autenticacao. Tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/auth/login">Voltar para o login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
