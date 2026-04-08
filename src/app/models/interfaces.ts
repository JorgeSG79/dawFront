
export interface Usuario {
  id: number;
  nombre: string;
  rol: string;
}

export interface Vehiculo {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
}

export interface Punto {
  id: number;
  nombre: string;
  activo: number;
}

export interface Estacion {
  id: number;
  nombre: string;
  direccion: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  latitud: number | string;
  longitud: number | string;
  puntos: Punto[];
  // Propiedades derivadas para compatibilidad
  num_puntos?: number;
  conectores_disponibles?: string | null;
}

export interface Recarga {
  id: number;
  usuario_id: number;
  punto_id: number;
  vehiculo_id: number;
  tarifa_id: number | null;
  fecha_reserva: string;
  nombre_punto: string;
  matricula: string;
  modelo: string;
  // Campos opcionales si el backend los agrega después
  fecha_inicio?: string;
  fecha_fin?: string | null;
  duracion_minutos?: number | null;
  kwh_consumidos?: number | null;
  coste_total?: number | null;
}
