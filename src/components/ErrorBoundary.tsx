import React, { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RotateCcw } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application render error:", error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground select-none">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-destructive/30 bg-muted text-destructive">
            <AlertCircle className="h-6 w-6" strokeWidth={1.5} />
          </div>

          <h1 className="mt-4 font-serif text-2xl font-normal text-foreground">
            Something went wrong
          </h1>
          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading this view. Your stored ledger data remains safe.
          </p>

          {this.state.error && (
            <div className="mt-4 max-w-md rounded-lg border border-border bg-card p-3 text-left font-mono text-xs text-muted-foreground overflow-x-auto">
              {this.state.error.message}
            </div>
          )}

          <div className="mt-5">
            <Button
              onClick={this.handleReload}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
              <span>Reload page</span>
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
