/* eslint-disable class-methods-use-this */
import { startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';

class AvaliableController {
  async index(req, res) {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Invalid Date' });
    }

    const searchDate = Number(date);

    const appointment = await Appointment.findAll({
      where: {
        provider_id: req.params.provider_id,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
    });

    return res.json(appointment);
  }
}

export default new AvaliableController();
