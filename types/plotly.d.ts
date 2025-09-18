declare module 'plotly.js-dist-min' {
  export interface PlotData {
    x?: any[]
    y?: any[]
    z?: any[]
    type?: string
    mode?: string
    name?: string
    colorscale?: string
    showscale?: boolean
    opacity?: number
    contours?: any
    [key: string]: any
  }

  export interface Layout {
    title?: any
    scene?: any
    margin?: any
    paper_bgcolor?: string
    plot_bgcolor?: string
    [key: string]: any
  }

  export interface Config {
    responsive?: boolean
    displayModeBar?: boolean
    modeBarButtonsToRemove?: string[]
    displaylogo?: boolean
    [key: string]: any
  }

  export function newPlot(
    root: HTMLElement,
    data: PlotData[],
    layout?: Layout,
    config?: Config
  ): Promise<void>

  export function react(
    root: HTMLElement,
    data: PlotData[],
    layout?: Layout,
    config?: Config
  ): Promise<void>

  export function purge(root: HTMLElement): void
}