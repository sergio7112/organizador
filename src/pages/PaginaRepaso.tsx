import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Check, RotateCcw } from 'lucide-react'
import { fechaCorta, hoyISO, sumarDias, textoDias } from '../domain/dates'
import { repasosPendientes } from '../domain/spacedRepetition'
import { useAppStore } from '../store/useAppStore'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Boton } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { PuntoColor } from '../components/ui/Etiquetas'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { FilaRepaso } from '../components/reviews/FilaRepaso'

export function PaginaRepaso() {
  const datos = useAppStore((estado) => estado.datos)
  const completarRepaso = useAppStore((estado) => estado.completarRepaso)

  const hoy = hoyISO()
  const limite = sumarDias(hoy, 7)

  const filas = useMemo(() => {
    return repasosPendientes(datos.repasos, limite)
      .map((repaso) => {
        const tema = datos.temas.find((item) => item.id === repaso.temaId)
        if (!tema) return null
        const asignatura = datos.asignaturas.find(
          (item) => item.id === tema.asignaturaId,
        )
        return { repaso, tema, asignatura }
      })
      .filter((fila): fila is NonNullable<typeof fila> => fila !== null)
  }, [datos])

  const vencidos = filas.filter((fila) => fila.repaso.fecha < hoy)
  const deHoy = filas.filter((fila) => fila.repaso.fecha === hoy)
  const proximos = filas.filter((fila) => fila.repaso.fecha > hoy)

  return (
    <>
      <CabeceraPagina
        titulo="Repaso"
        descripcion="Repaso espaciado a 1, 3 y 7 días"
      />

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          {
            etiqueta: 'Atrasados',
            valor: vencidos.length,
            tono: 'text-[var(--peligro)]',
            fondo:
              'linear-gradient(135deg, var(--peligro-suave), var(--superficie) 72%)',
          },
          {
            etiqueta: 'Para hoy',
            valor: deHoy.length,
            tono: 'text-[var(--primario)]',
            fondo:
              'linear-gradient(135deg, var(--primario-suave), var(--superficie) 72%)',
          },
          {
            etiqueta: 'Próximos 7 días',
            valor: proximos.length,
            tono: '',
            fondo:
              'linear-gradient(135deg, var(--superficie-2), var(--superficie) 72%)',
          },
        ].map((dato) => (
          <Tarjeta
            key={dato.etiqueta}
            className="p-3 sm:p-4"
            style={{ backgroundImage: dato.fondo }}
          >
            <p
              className={`text-xl font-semibold leading-none tabular-nums ${dato.tono}`}
            >
              {dato.valor}
            </p>
            <p className="mt-1 text-[11px] leading-tight text-[var(--texto-suave)] sm:text-xs">
              {dato.etiqueta}
            </p>
          </Tarjeta>
        ))}
      </div>

      {filas.length === 0 ? (
        <EstadoVacio
          icono={RotateCcw}
          titulo="No hay repasos pendientes"
          descripcion="Al pasar un tema a «Estudiando» se programan repasos a 1, 3 y 7 días."
          accion={
            <Link to="/asignaturas">
              <Boton variante="secundario">Ver asignaturas</Boton>
            </Link>
          }
        />
      ) : (
        <>
          {(vencidos.length > 0 || deHoy.length > 0) && (
            <section className="mb-6">
              <h2 className="mb-2 px-1 text-base font-semibold">
                Para repasar ahora
              </h2>
              <Tarjeta className="overflow-hidden">
                <ul className="divide-y divide-[var(--borde)]">
                  {[...vencidos, ...deHoy].map(({ repaso, tema, asignatura }) => (
                    <FilaRepaso
                      key={repaso.id}
                      repaso={repaso}
                      tema={tema}
                      asignatura={asignatura}
                      onCompletar={() => completarRepaso(repaso.id)}
                    />
                  ))}
                </ul>
              </Tarjeta>
            </section>
          )}

          {proximos.length > 0 && (
            <section>
              <h2 className="mb-2 px-1 text-base font-semibold">Próximamente</h2>
              <Tarjeta className="overflow-hidden">
                <ul className="divide-y divide-[var(--borde)]">
                  {proximos.map(({ repaso, tema, asignatura }) => (
                    <li
                      key={repaso.id}
                      className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
                    >
                      <PuntoColor color={asignatura?.color ?? 'var(--primario)'} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{tema.titulo}</p>
                        <p className="truncate text-xs text-[var(--texto-suave)]">
                          {asignatura?.nombre ?? 'Asignatura'} · {textoDias(repaso.fecha)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-[var(--texto-suave)]">
                        {fechaCorta(repaso.fecha)}
                      </span>
                      <Boton
                        variante="fantasma"
                        tamano="icono"
                        onClick={() => completarRepaso(repaso.id)}
                        aria-label={`Adelantar repaso de ${tema.titulo}`}
                        className="size-8 shrink-0 text-[var(--texto-suave)]"
                      >
                        <Check size={15} />
                      </Boton>
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            </section>
          )}
        </>
      )}

      <Tarjeta className="mt-6 p-4">
        <h2 className="text-sm font-semibold">Cómo funciona</h2>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-[var(--texto-suave)]">
          <li>
            Al pasar un tema a «Estudiando» se programan repasos a 1, 3 y 7 días.
          </li>
          <li>
            Completar los repasos de 1 y 3 días pasa el tema a «Repasado»; el de 7
            días lo marca como «Dominado».
          </li>
          <li>Puedes adelantar un repaso aunque no haya llegado su fecha.</li>
        </ul>
      </Tarjeta>
    </>
  )
}
