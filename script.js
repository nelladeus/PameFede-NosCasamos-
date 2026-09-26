/* ==========================================================================
   INVITACIÓN DIGITAL — script.js
   Todo el JavaScript de la página, organizado por sección/funcionalidad.
   No usa librerías externas: es JS nativo (vanilla).
   ========================================================================== */

/* Esperamos a que todo el HTML esté cargado antes de tocar el DOM */
document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------------
     0. ICONOS (Lucide)
     Lucide necesita que llamemos a esta función para "dibujar" los <i data-lucide="...">
     como SVG reales dentro de la página.
  ------------------------------------------------------------------------ */
  if (window.lucide) {
    lucide.createIcons();
  }

  /* ------------------------------------------------------------------------
     1. PORTADA — abrir invitación
     Al tocar el botón, le agregamos una clase que dispara la animación
     CSS (translateY -100%) y habilitamos el scroll del body.
  ------------------------------------------------------------------------ */
  const portada = document.getElementById('portada');
  const btnAbrir = document.getElementById('btnAbrir');
  const btnMusica = document.getElementById('btnMusica');

  const audioInvitacion = new Audio('Assets/musica.mp3');
  audioInvitacion.loop = true;
  audioInvitacion.preload = 'auto';
  audioInvitacion.volume = 0;
  let musicaIniciada = false;
  let fadeFrame = null;
  const volumenObjetivo = 0.35;
  const duracionFadeMs = 2200;

  function detenerFade() {
    if (fadeFrame !== null) {
      cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }
  }

  function aplicarFadeEntrada() {
    detenerFade();

    const inicio = performance.now();
    const fin = inicio + duracionFadeMs;

    const actualizarVolumen = () => {
      const ahora = performance.now();
      const progreso = Math.min(1, (ahora - inicio) / duracionFadeMs);
      audioInvitacion.volume = progreso * volumenObjetivo;

      if (ahora < fin) {
        fadeFrame = requestAnimationFrame(actualizarVolumen);
      } else {
        audioInvitacion.volume = volumenObjetivo;
        fadeFrame = null;
      }
    };

    fadeFrame = requestAnimationFrame(actualizarVolumen);
  }

  function actualizarBotonMusica() {
    const reproduciendo = !audioInvitacion.paused;
    btnMusica.setAttribute('aria-pressed', String(reproduciendo));
    btnMusica.setAttribute('aria-label', reproduciendo ? 'Pausar música' : 'Reproducir música');

    const iconoNombre = reproduciendo ? 'volume-2' : 'volume-x';
    btnMusica.innerHTML = `<i data-lucide="${iconoNombre}"></i>`;
    if (window.lucide) {
      lucide.createIcons({ parent: btnMusica });
    }
  }

  actualizarBotonMusica();

  async function reproducirMusica() {
    if (musicaIniciada && !audioInvitacion.paused) return;

    try {
      await audioInvitacion.play();
      musicaIniciada = true;
      aplicarFadeEntrada();
      actualizarBotonMusica();
    } catch (error) {
      console.warn('No se pudo reproducir la música de fondo:', error);
    }
  }

  btnMusica.addEventListener('click', async () => {
    if (audioInvitacion.paused) {
      await reproducirMusica();
    } else {
      detenerFade();
      audioInvitacion.pause();
      actualizarBotonMusica();
    }
  });

  btnAbrir.addEventListener('click', async () => {
    await reproducirMusica();
    portada.classList.add('portada--abierta');
    document.body.classList.add('abierto'); // habilita el scroll (ver CSS)
    btnMusica.style.display = 'inline-flex';

    // Una vez terminada la transición, sacamos la portada del flujo
    // del documento para que no interfiera con el scroll ni el tab-order.
    const alTerminar = (evento) => {
      // Ignorar transiciones de elementos hijos (como el botón al soltar el clic)
      if (evento.target === portada) {
        portada.style.display = 'none';
        portada.removeEventListener('transitionend', alTerminar);
      }
    };
    portada.addEventListener('transitionend', alTerminar);
  });


  /* ------------------------------------------------------------------------
     2. CUENTA REGRESIVA
     Calculamos la diferencia entre "ahora" y la fecha del evento,
     y actualizamos los 4 números cada segundo.
  ------------------------------------------------------------------------ */

  // Fecha del evento: 26 de septiembre de 2026, 13:00 hs
  const fechaEvento = new Date('2026-09-26T13:00:00');

  const elDias = document.getElementById('cd-dias');
  const elHoras = document.getElementById('cd-horas');
  const elMin = document.getElementById('cd-min');
  const elSeg = document.getElementById('cd-seg');

  // Agrega un cero adelante si el número tiene un solo dígito (5 -> "05")
  function conCeroAdelante(numero) {
    return String(numero).padStart(2, '0');
  }

  function actualizarCountdown() {
    const ahora = new Date();
    const diferenciaMs = fechaEvento - ahora;

    // Si la fecha ya pasó, mostramos todo en cero y frenamos el intervalo
    if (diferenciaMs <= 0) {
      elDias.textContent = elHoras.textContent = elMin.textContent = elSeg.textContent = '00';
      clearInterval(intervaloCountdown);
      return;
    }

    const segundosTotales = Math.floor(diferenciaMs / 1000);
    const dias = Math.floor(segundosTotales / 86400);
    const horas = Math.floor((segundosTotales % 86400) / 3600);
    const min = Math.floor((segundosTotales % 3600) / 60);
    const seg = segundosTotales % 60;

    elDias.textContent = conCeroAdelante(dias);
    elHoras.textContent = conCeroAdelante(horas);
    elMin.textContent = conCeroAdelante(min);
    elSeg.textContent = conCeroAdelante(seg);
  }

    let intervaloCountdown;
  actualizarCountdown(); // primer render inmediato, sin esperar 1 segundo
  intervaloCountdown = setInterval(actualizarCountdown, 1000);


  /* ------------------------------------------------------------------------
     2b. BOTÓN "Agendar en Google Calendar"
     Armamos la URL especial de Google Calendar con los datos del evento.
     Formato de fechas requerido por Google: AAAAMMDDTHHmmSSZ (UTC)
  ------------------------------------------------------------------------ */
  function formatearFechaGoogle(fecha) {
    return fecha.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  // Duración: 5 horas (13:00 - 18:00)
  const fechaFinEvento = new Date(fechaEvento.getTime() + (5 * 60 * 60 * 1000)); // +5hs de duración

  const paramsCalendar = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Casamiento Pame y Fede',
    dates: `${formatearFechaGoogle(fechaEvento)}/${formatearFechaGoogle(fechaFinEvento)}`,
    details: 'Casamiento de Pame y Fede - Salón San Pietro',
    location: 'Salón San Pietro, Dr. Rodolfo Monte 1246, Morón, Buenos Aires',
  });

  document.getElementById('btnCalendar').href =
    `https://calendar.google.com/calendar/render?${paramsCalendar.toString()}`;


  /* ------------------------------------------------------------------------
     3. TOAST — notificación breve reutilizable
     La usan tanto "Copiar hashtag" como "Copiar Alias/CBU" del modal.
  ------------------------------------------------------------------------ */
  const toast = document.getElementById('toast');
  let timeoutToast; // guardamos el id para poder cancelar si se togglea rápido

  function mostrarToast(mensaje) {
    toast.textContent = mensaje;
    toast.classList.add('toast--visible');

    clearTimeout(timeoutToast);
    timeoutToast = setTimeout(() => {
      toast.classList.remove('toast--visible');
    }, 2000);
  }

  // Función helper para copiar texto al portapapeles con fallback
  async function copiarAlPortapapeles(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (err) {
      // Fallback para navegadores/contextos que no soportan la Clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  }


  /* ------------------------------------------------------------------------
     3b. COPIAR HASHTAG
  ------------------------------------------------------------------------ */
  const btnCopiarHashtag = document.getElementById('btnCopiarHashtag');
  const hashtagTexto = document.getElementById('hashtagTexto').textContent.trim();

  btnCopiarHashtag.addEventListener('click', async () => {
    await copiarAlPortapapeles(hashtagTexto);
    mostrarToast('Hashtag copiado ✓');
  });


  /* ------------------------------------------------------------------------
     4. MODAL — Datos bancarios
  ------------------------------------------------------------------------ */
  const modalOverlay = document.getElementById('modalOverlay');
  const btnAbrirModal = document.getElementById('btnAbrirModal');
  const btnCerrarModal = document.getElementById('btnCerrarModal');

  function abrirModal() {
    modalOverlay.classList.add('modal-overlay--activo');
  }
  function cerrarModal() {
    modalOverlay.classList.remove('modal-overlay--activo');
  }

  btnAbrirModal.addEventListener('click', abrirModal);
  btnCerrarModal.addEventListener('click', cerrarModal);

  // También cerramos el modal si tocan el fondo oscuro (fuera de la tarjeta)
  modalOverlay.addEventListener('click', (evento) => {
    if (evento.target === modalOverlay) cerrarModal();
  });

  // Botones "Copiar Alias" y "Copiar CBU" dentro del modal
  // Usamos data-copiar="idDelElemento" para saber qué valor copiar de cada botón.
  document.querySelectorAll('.btn-copiar').forEach((boton) => {
    boton.addEventListener('click', async () => {
      const idObjetivo = boton.getAttribute('data-copiar');
      const valor = document.getElementById(idObjetivo).textContent.trim();
      await copiarAlPortapapeles(valor);
      mostrarToast('Copiado ✓');
    });
  });


  /* ------------------------------------------------------------------------
     5. ANIMACIONES AL HACER SCROLL (fade-in con IntersectionObserver)
     Cada elemento con la clase .fade-in empieza invisible y desplazado;
     cuando entra en pantalla, le agregamos .visible y el CSS anima la transición.
  ------------------------------------------------------------------------ */
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target); // solo animamos una vez
      }
    });
  }, {
    threshold: 0.15, // se activa cuando el 15% del elemento es visible
  });

  document.querySelectorAll('.fade-in').forEach((elemento) => {
    observador.observe(elemento);
  });

});
