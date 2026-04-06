
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

export interface Estacion {
  id: number;
  nombre: string;
  direccion: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  activo?: number;
  latitud: number | string;
  longitud: number | string;
  num_puntos: number;
  conectores_disponibles: string | null;
}

export interface Recarga {
  id: number;
  reserva_id: number | null;
  usuario_id: number;
  vehiculo_id: number;
  punto_recarga_id: number;
  tarifa_id: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_minutos: number | null;
  kwh_consumidos: number | null;
  coste_total: number | null;
  matricula?: string;
}
