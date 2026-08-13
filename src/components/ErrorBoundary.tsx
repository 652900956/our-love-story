import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * 全局错误边界：任何渲染期 / effect 期的未捕获异常都会被它接住，
 * 不再让整棵 React 树卸载成「白屏」，而是显示可读的错误信息与堆栈，
 * 方便快速定位问题。点击「重新加载」可重试。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: unknown) {
    // 同时打到控制台，便于在 DevTools 查看完整堆栈
    console.error('[ErrorBoundary] 捕获到未处理异常：', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: "'Noto Serif SC', serif",
            background: '#fff5f3',
            color: '#333',
          }}
        >
          <div
            style={{
              maxWidth: '640px',
              width: '100%',
              background: '#fff',
              borderRadius: '1.5rem',
              padding: '2rem 2.2rem',
              boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            }}
          >
            <h1 style={{ margin: '0 0 0.6rem', fontSize: '1.5rem', color: '#f16b4f' }}>
              页面出了点小问题 🥺
            </h1>
            <p style={{ margin: '0 0 1rem', color: '#666', lineHeight: 1.7 }}>
              渲染过程中捕获到一个未处理的异常，导致内容无法正常显示。错误信息如下：
            </p>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#f7f7f7',
                borderRadius: '0.8rem',
                padding: '1rem',
                fontSize: '0.82rem',
                color: '#c0392b',
                maxHeight: '260px',
                overflow: 'auto',
                margin: '0 0 1.4rem',
              }}
            >
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              onClick={this.handleReload}
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: '1rem',
                color: '#fff',
                background: '#f16b4f',
                border: 'none',
                borderRadius: '1rem',
                padding: '0.7rem 2.2rem',
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(241,107,79,0.35)',
              }}
            >
              重新加载
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
