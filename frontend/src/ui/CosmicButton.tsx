import type { ButtonHTMLAttributes } from 'react'

/** Botón principal cósmico (EMPEZAR/START, ABRIR PROYECTO/OPEN PROJECT, COMENZAR). La interacción con el cursor vive en `cosmic.ts`. */
export default function CosmicButton({ primary, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button {...rest} className={`cosmic ${primary ? 'primary' : ''} ${className ?? ''}`}>
      <span className="cosmic-nebula" aria-hidden="true" />
      <span className="cosmic-stars" aria-hidden="true" />
      <span className="cosmic-ring" aria-hidden="true" />
      <span className="cosmic-label">{children}</span>
    </button>
  )
}
