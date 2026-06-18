import { Response } from 'express';
import * as adminService from './admin.service';
import { AuthRequest } from '../auth/auth.middleware';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json(users);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const user = await adminService.updateUserRole(
      Number(req.params.id), req.body.role
    );
    res.status(200).json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.deleteUser(Number(req.params.id));
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const validateKyc = async (req: AuthRequest, res: Response) => {
  try {
    const { action, reason } = req.body;
    const result = await adminService.validateKyc(
      Number(req.params.id), action, reason
    );
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllReservations = async (req: AuthRequest, res: Response) => {
  try {
    const reservations = await adminService.getAllReservations();
    res.status(200).json(reservations);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllServiceBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await adminService.getAllServiceBookings();
    res.status(200).json(bookings);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllServices = async (req: AuthRequest, res: Response) => {
  try {
    const services = await adminService.getAllServices();
    res.status(200).json(services);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllVenues = async (req: AuthRequest, res: Response) => {
  try {
    const venues = await adminService.getAllVenues();
    res.status(200).json(venues);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getPlatformStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await adminService.getPlatformStats();
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};