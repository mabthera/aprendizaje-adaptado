# Metodología matemática utilizada

Esta parte solo es para los interesados en conocer los entresijos matemáticos que conforman la metodología adaptativa utilizada por el protocolo anterior.

## Inferencia bayesiana

El teorema de Bayes permite actualizar la probabilidad de una hipótesis cuando obtenemos una nueva evidencia. Es decir, partimos de una idea inicial sobre el nivel —o la categoría que hayamos definido— del alumno y la vamos modificando a medida que responde preguntas.

En un recurso adaptativo, las hipótesis pueden ser, por ejemplo:

* El alumno tiene un nivel básico.
* El alumno tiene un nivel medio.
* El alumno tiene un nivel avanzado.

Al comenzar, el sistema todavía no sabe cuál de estas hipótesis es la más probable, así que se asigna la misma probabilidad a todas:

[
P(\text{básico}) = 33{,}3%
]

[
P(\text{medio}) = 33{,}3%
]

[
P(\text{avanzado}) = 33{,}3%
]

Estas probabilidades iniciales se llaman **probabilidades previas**. Representan lo que el sistema cree antes de observar la respuesta del alumno.

Cuando el alumno contesta una pregunta, aparece una nueva evidencia, ya que ha acertado o ha fallado una pregunta de cierto nivel. Esa respuesta modifica las probabilidades anteriores. Si acierta una pregunta avanzada, aumentará la probabilidad de que pertenezca al nivel avanzado. Si falla varias preguntas básicas, aumentará la probabilidad de que necesite refuerzo en ese nivel.

En forma matemática, el teorema de Bayes se expresa así:

[
P(H \mid E) = \frac{P(E \mid H) \cdot P(H)}{P(E)}
]

Donde:

* (P(H \mid E)) es la probabilidad de la hipótesis después de observar la evidencia. En nuestro caso, sería la probabilidad de que el alumno tenga un determinado nivel después de ver su respuesta.
* (P(H)) es la probabilidad previa de esa hipótesis, antes de la respuesta.
* (P(E \mid H)) es la probabilidad, llamada **verosimilitud**, de observar una determinada respuesta del alumno si una hipótesis concreta fuera cierta. Por ejemplo, qué probabilidad habría de que un alumno de nivel avanzado acertara una pregunta avanzada.
* (P(E)) es la probabilidad de observar esa evidencia, sin saber todavía cuál es el nivel real del alumno. En nuestro ejemplo, sería la probabilidad global de que el alumno acierte una pregunta avanzada, antes de decidir si pertenece al nivel básico, medio o avanzado.

Aplicado a un test adaptativo, el razonamiento sería el siguiente:

* Si un alumno fuera de nivel avanzado, sería bastante probable que acertara esta pregunta difícil.
* Si fuera de nivel básico, sería poco probable que la acertara.
* Como la ha acertado, aumenta la probabilidad de que sea de nivel avanzado.

Y al contrario:

* Si un alumno falla una pregunta básica, esa respuesta es más compatible con la hipótesis de que necesita refuerzo.
* Por tanto, el sistema aumenta la probabilidad de que esté en un nivel inicial o de que tenga dificultades en ese contenido.

Lo importante es que el sistema no toma una única respuesta como definitiva. Cada respuesta modifica un poco el diagnóstico. Después de varias preguntas, las probabilidades se van separando: una hipótesis gana peso y otras lo pierden.

Por ejemplo, después de varias respuestas, el sistema podría obtener algo así de un alumno en particular:

[
P(\text{básico}) = 12%
]

[
P(\text{medio}) = 31%
]

[
P(\text{avanzado}) = 57%
]

Esto no significa que el alumno tenga una nota de 5,7 ni que haya acertado el 57 % de las preguntas. Significa que, según las respuestas observadas, el sistema considera que la hipótesis más probable es que el alumno se encuentre en el nivel avanzado.

Esta es la diferencia principal respecto a un test tradicional. En un test lineal, las respuestas se acumulan para obtener una puntuación. En un test adaptativo bayesiano, las respuestas se utilizan como evidencias para actualizar un diagnóstico.

El mismo principio puede aplicarse a otros tipos de recursos. En un itinerario de aprendizaje, la hipótesis no tiene por qué ser “nivel básico, medio o avanzado”, sino que puede ser “domina la técnica”, “está en proceso” o “necesita refuerzo”. Cada ejercicio resuelto aporta una nueva evidencia y permite decidir si conviene avanzar, repetir, ofrecer una explicación adicional o proponer actividades de mayor dificultad.

La inferencia bayesiana permite que el recurso educativo no siga un camino fijo, sino que tome decisiones a partir de la información que va obteniendo del alumno.

## Verosimilitudes y modelo IRT 3PL

Para que Bayes actualice las probabilidades, el sistema calcula las verosimilitudes. En las preguntas o actividades organizadas por niveles de dificultad, estas verosimilitudes se generan mediante el modelo **IRT 3PL** (*Item Response Theory, three-parameter logistic model*), es decir, el modelo logístico de tres parámetros de la teoría de respuesta al ítem.

La idea general es que la probabilidad de acertar una pregunta aumenta cuando el nivel hipotético del alumno supera la dificultad de la pregunta, y disminuye cuando la dificultad supera el nivel hipotético del alumno.

El modelo usado es:

[
P(\text{acierto} \mid H_i, q)
=============================

c_q
+
(1 - c_q)
\cdot
\frac{1}{1 + e^{-a(\theta_i - b_q)}}
]

Donde:

* (\theta_i) representa numéricamente la hipótesis o nivel (H_i).
* (b_q) representa la dificultad de la pregunta o actividad.
* (a) es el parámetro de discriminación.
* (c_q) es la probabilidad mínima de acierto por azar.

En el modelo IRT 3PL, estos tres parámetros tienen una función concreta:

* (b_q) sitúa la dificultad del ítem.
* (a) indica cuánto discrimina entre niveles próximos.
* (c_q) establece el suelo de probabilidad de acierto.

En preguntas de opción múltiple, este suelo se calcula a partir del número de opciones:

[
c_q = \frac{1}{m_q}
]

Por ejemplo, en una pregunta de cuatro opciones:

[
c_q = \frac{1}{4} = 0{,}25
]

Esto significa que la probabilidad de acierto no se considera inferior al 25 %, porque incluso un alumno que responde al azar tiene esa probabilidad de acertar.

Si el alumno falla, se usa la probabilidad complementaria:

[
P(\text{fallo} \mid H_i, q)
===========================

1 - P(\text{acierto} \mid H_i, q)
]

Estas probabilidades de acierto y fallo son las verosimilitudes que utiliza Bayes para actualizar el diagnóstico.

El modelo IRT 3PL no sustituye al teorema de Bayes. Su función es generar las verosimilitudes que Bayes necesita para hacer la actualización.

En recursos que no son tests, la misma lógica se aplica a preguntas, pasos, retos o actividades autocorregibles, siempre que se representen mediante una dificultad, una respuesta observable y una interpretación del resultado. La evidencia es un acierto, un fallo, un paso superado, una pista solicitada, un intento adicional o un error detectado, siempre que el recurso haya definido cómo se traduce esa actuación en una evidencia utilizable.

Cuando las hipótesis no son niveles ordenados, por ejemplo, distintos errores conceptuales, el modelo IRT 3PL no es el adecuado, porque presupone una escala común de nivel o dominio. En esos casos, las verosimilitudes se definen según la relación diagnóstica entre cada actividad y cada hipótesis. La actualización bayesiana sigue siendo la misma; lo que cambia es la forma de obtener las verosimilitudes.

## Entropía de Shannon

La incertidumbre del sistema se mide mediante la entropía de Shannon:

[
H = - \sum_i p_i \log_2(p_i)
]

Donde (p_i) es la probabilidad actual de cada hipótesis.

Cuando las probabilidades están muy repartidas, la entropía es alta. Por ejemplo, si básico, medio y avanzado tienen probabilidades parecidas, el sistema todavía no tiene un diagnóstico claro.

Cuando una hipótesis concentra la mayor parte de la probabilidad, la entropía baja. En ese caso, el sistema tiene más seguridad sobre el estado del alumno.

La entropía se usa para tres cosas:

1. Medir la incertidumbre del diagnóstico.
2. Seleccionar actividades que aporten información.
3. Decidir si el proceso finaliza.

## Selección adaptativa y ganancia de información

Después de actualizar las probabilidades, el sistema decide qué pregunta, explicación, pista, ejercicio o actividad presenta a continuación.

Esta selección no se basa simplemente en subir la dificultad tras un acierto y bajarla tras un fallo. El método utilizado es la **ganancia esperada de información**. Es decir, el sistema estima qué actividad reduce más la incertidumbre sobre el estado del alumno.

Como la incertidumbre se mide con la entropía de Shannon, la ganancia de información se calcula como una reducción esperada de entropía. De forma simplificada:

[
IG(q)
=====

## H(\text{antes})

H(\text{después esperado})
]

Para cada posible actividad, el sistema calcula qué ocurre si el alumno la supera y qué ocurre si no la supera. En cada caso estima cómo cambian las probabilidades de las hipótesis y qué entropía tiene la nueva distribución. Después compara la entropía actual con la entropía esperada tras esa actividad.

La actividad más adecuada es la que distingue mejor entre las hipótesis que todavía son plausibles. Por eso, la mejor pregunta no siempre es la que coincide exactamente con el nivel más probable. Si el sistema duda entre nivel medio y avanzado, una pregunta difícil resulta más informativa que una pregunta media. Si duda entre nivel básico y medio, selecciona una pregunta más sencilla o intermedia.

Cuando varias actividades tienen una ganancia de información muy parecida, el sistema introduce diversidad de contenidos. Así evita repetir siempre el mismo tipo de pregunta o el mismo concepto cuando hay varias opciones igualmente útiles.

## Criterio de parada y resultado final

El proceso se detiene cuando se cumple alguna de estas condiciones:

* El sistema alcanza una confianza suficiente.
* La entropía baja por debajo de un umbral previsto.
* Se llega al número máximo de preguntas o pasos.
* Las actividades disponibles ya no aportan información relevante.

El resultado final no se limita a una etiqueta ni a una puntuación. Se presenta como una interpretación pedagógica:

* Qué parece dominar el alumno.
* Qué dificultades muestra.
* Qué conviene reforzar.
* Con qué grado de seguridad se propone el diagnóstico.

Si la incertidumbre sigue siendo alta, el sistema lo indica claramente. En ese caso, el resultado se presenta como una estimación provisional basada en las evidencias disponibles, no como una conclusión definitiva.

Esta es la diferencia principal respecto a un recurso educativo lineal. En una secuencia fija, todos los alumnos recorren el mismo camino y sus respuestas solo sirven para avanzar, retroceder o recibir una puntuación.

En un recurso adaptativo bayesiano, cada respuesta o actuación se utiliza como evidencia para actualizar un modelo del estado del alumno y decidir cuál debe ser el siguiente paso:

* Una nueva pregunta.
* Una explicación.
* Una pista.
* Una actividad de refuerzo.
* Una propuesta de ampliación.
* Un cambio de itinerario.
* Una recomendación de recursos.
