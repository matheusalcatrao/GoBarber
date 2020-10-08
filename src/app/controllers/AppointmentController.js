/* eslint-disable class-methods-use-this */
import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import NotificationSchema from '../schemas/Notification';
import Queue from '../../lib/Queue';
import CancelationEmail from '../jobs/CancellationMail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointment = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointment);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validate fails' });
    }

    // Check provider is a provider
    const { provider_id, date } = req.body;
    console.log('provider id', provider_id);

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointment with providers' });
    }

    // if (provider_id === req.userId) {
    //   return res.status(400).json({ error: 'Provider mark for yourself ' });
    // }

    // Cheack past dates
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permited' });
    }

    // Check availability appointment
    const checkAvailability = await Appointment.findOne({
      where: {
        provide_id: provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res.json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provide_id: provider_id,
      date,
    });

    const { name } = await User.findByPk(req.userId);
    const formatDate = format(hourStart, "'dia' dd 'de' MMM', as ' H:mm'h'", {
      locale: pt,
    });

    // Notification appointment provider
    await NotificationSchema.create({
      content: `Novo agendamento de ${name} para ${formatDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    /* Check if appointment if this user */
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointment.user_id !== req.userId) {
      return res.status(400).json({ error: 'You cant delete appointment' });
    }

    const subDate = subHours(appointment.date, 2);

    if (isBefore(subDate, new Date())) {
      return res
        .status(401)
        .json({ error: 'you can only cancel appointment 2 hours in advance.' });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await Queue.add(CancelationEmail.key, {
      appointment,
    });

    return res.json(appointment);
  }
}
export default new AppointmentController();
